<?php
/**
 * Trulle Portal Config Elementor widget.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Trulle_Portal_Config_Widget extends \Elementor\Widget_Base {
	/**
	 * Runtime currently ships 5 geometric portal slots.
	 */
	private const MAX_PORTAL_ID = 5;
	/**
	 * Supported preview media extensions.
	 *
	 * @var string[]
	 */
	private $supported_preview_extensions = array(
		'avif',
		'bmp',
		'gif',
		'jpg',
		'jpeg',
		'png',
		'svg',
		'webp',
		'mp4',
		'webm',
		'ogg',
		'mov',
		'm4v',
	);

	/**
	 * Runtime normalization warnings for editor visibility.
	 *
	 * @var string[]
	 */
	private $normalize_warnings = array();

	public function get_name(): string {
		return 'trulle_portal_config';
	}

	public function get_title(): string {
		return esc_html__( 'Trulle Portal Config', 'trulle-portal-elementor' );
	}

	public function get_icon(): string {
		return 'eicon-kit-details';
	}

	public function get_categories(): array {
		return array( 'general' );
	}

	public function get_style_depends(): array {
		return array( 'trulle-portal-nav' );
	}

	public function get_script_depends(): array {
		return array( 'trulle-portal-nav' );
	}

	protected function register_controls(): void {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => esc_html__( 'Portals', 'trulle-portal-elementor' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'help_text',
			array(
				'type'            => \Elementor\Controls_Manager::RAW_HTML,
				'raw'             => esc_html__( 'Each row is one portal. Destination is required. Preview should be an image/video file URL or media selection.', 'trulle-portal-elementor' ),
				'content_classes' => 'elementor-descriptor',
			)
		);

		$repeater = new \Elementor\Repeater();

		$repeater->add_control(
			'portal_id',
			array(
				'label'   => esc_html__( 'Portal ID', 'trulle-portal-elementor' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => '1',
				'options' => array(
					'1'  => '1',
					'2'  => '2',
					'3'  => '3',
					'4'  => '4',
					'5'  => '5',
				),
			)
		);

		$repeater->add_control(
			'label',
			array(
				'label'       => esc_html__( 'Label', 'trulle-portal-elementor' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'label_block' => true,
				'placeholder' => esc_html__( 'Portal 1', 'trulle-portal-elementor' ),
			)
		);

		$repeater->add_control(
			'destination',
			array(
				'label'         => esc_html__( 'What opens when clicked?', 'trulle-portal-elementor' ),
				'type'          => \Elementor\Controls_Manager::URL,
				'label_block'   => true,
				'placeholder'   => 'https://example.com/page',
				'show_external' => false,
				'dynamic'       => array( 'active' => true ),
			)
		);

		$repeater->add_control(
			'preview_media',
			array(
				'label'       => esc_html__( 'What appears in peephole on hover?', 'trulle-portal-elementor' ),
				'type'        => \Elementor\Controls_Manager::MEDIA,
				'media_types' => array( 'image', 'video', 'svg' ),
				'dynamic'     => array( 'active' => true ),
			)
		);

		$repeater->add_control(
			'preview_url',
			array(
				'label'       => esc_html__( 'Preview URL (optional override)', 'trulle-portal-elementor' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'label_block' => true,
				'placeholder' => '/wp-content/uploads/preview.mp4',
				'dynamic'     => array( 'active' => true ),
			)
		);

		$repeater->add_control(
			'enabled',
			array(
				'label'        => esc_html__( 'Enabled', 'trulle-portal-elementor' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'label_on'     => esc_html__( 'Yes', 'trulle-portal-elementor' ),
				'label_off'    => esc_html__( 'No', 'trulle-portal-elementor' ),
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->add_control(
			'portals',
			array(
				'label'       => esc_html__( 'Portal Rows', 'trulle-portal-elementor' ),
				'type'        => \Elementor\Controls_Manager::REPEATER,
				'fields'      => $repeater->get_controls(),
				'title_field' => '{{{ portal_id }}} - {{{ label }}}',
				'default'     => array(
					array(
						'portal_id' => '1',
						'label'     => 'Portal 1',
						'enabled'   => 'yes',
					),
				),
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Normalize URL-like input.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private function normalize_url_like( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}
		$value = trim( $value );
		if ( '' === $value ) {
			return '';
		}
		if ( 0 === strpos( $value, '/' ) || 0 === strpos( $value, '#' ) ) {
			return $value;
		}
		return esc_url_raw( $value );
	}

	/**
	 * Extract file extension from URL/path.
	 *
	 * @param string $url URL or path.
	 * @return string
	 */
	private function file_extension( string $url ): string {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( ! is_string( $path ) || '' === $path ) {
			return '';
		}
		return strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
	}

	/**
	 * Validate preview type by extension.
	 *
	 * @param string $preview Preview URL/path.
	 * @return bool
	 */
	private function is_valid_preview( string $preview ): bool {
		if ( '' === $preview ) {
			return true;
		}
		$ext = $this->file_extension( $preview );
		return in_array( $ext, $this->supported_preview_extensions, true );
	}

	/**
	 * Transform editor rows into normalized portal records.
	 *
	 * @param array $rows Repeater rows.
	 * @return array
	 */
	private function normalize_portals( array $rows ): array {
		$seen_ids = array();
		$result   = array();
		$this->normalize_warnings = array();

		foreach ( $rows as $row ) {
			$enabled = isset( $row['enabled'] ) && 'yes' === $row['enabled'];
			if ( ! $enabled ) {
				continue;
			}

			$id = isset( $row['portal_id'] ) ? absint( $row['portal_id'] ) : 0;
			if ( $id < 1 || $id > self::MAX_PORTAL_ID ) {
				$this->normalize_warnings[] = sprintf(
					/* translators: %s: portal id */
					esc_html__( 'Skipped a row with unsupported Portal ID "%s".', 'trulle-portal-elementor' ),
					(string) $id
				);
				continue;
			}
			if ( isset( $seen_ids[ $id ] ) ) {
				$this->normalize_warnings[] = sprintf(
					/* translators: %d: portal id */
					esc_html__( 'Skipped duplicate Portal ID "%d". Keep one row per portal.', 'trulle-portal-elementor' ),
					$id
				);
				continue;
			}

			$destination = '';
			if ( isset( $row['destination'] ) && is_array( $row['destination'] ) ) {
				$destination = $this->normalize_url_like( $row['destination']['url'] ?? '' );
			}
			if ( '' === $destination ) {
				$this->normalize_warnings[] = sprintf(
					/* translators: %d: portal id */
					esc_html__( 'Skipped Portal ID "%d" because destination is empty.', 'trulle-portal-elementor' ),
					$id
				);
				continue;
			}

			$preview_media = '';
			if ( isset( $row['preview_media'] ) && is_array( $row['preview_media'] ) ) {
				$preview_media = $this->normalize_url_like( $row['preview_media']['url'] ?? '' );
			}
			$preview_manual = $this->normalize_url_like( $row['preview_url'] ?? '' );
			$preview        = '' !== $preview_manual ? $preview_manual : $preview_media;

			if ( ! $this->is_valid_preview( $preview ) ) {
				$this->normalize_warnings[] = sprintf(
					/* translators: %d: portal id */
					esc_html__( 'Portal ID "%d" has unsupported preview format. Preview was removed.', 'trulle-portal-elementor' ),
					$id
				);
				$preview = '';
			}

			$label = sanitize_text_field( $row['label'] ?? '' );

			$result[] = array(
				'id'          => $id,
				'label'       => $label,
				'destination' => $destination,
				'preview'     => $preview,
			);
			$seen_ids[ $id ] = true;
		}

		return $result;
	}

	protected function render(): void {
		$settings = $this->get_settings_for_display();
		$rows     = isset( $settings['portals'] ) && is_array( $settings['portals'] ) ? $settings['portals'] : array();
		$portals  = $this->normalize_portals( $rows );

		if ( ! empty( $this->normalize_warnings ) ) {
			echo '<div class="trulle-portal-config-warning">';
			echo '<strong>' . esc_html__( 'Configuration notes:', 'trulle-portal-elementor' ) . '</strong>';
			echo '<ul>';
			foreach ( $this->normalize_warnings as $warning ) {
				echo '<li>' . esc_html( $warning ) . '</li>';
			}
			echo '</ul>';
			echo '</div>';
		}

		if ( empty( $portals ) ) {
			echo '<div class="trulle-portal-config-warning">' . esc_html__( 'No valid portal rows configured. Add at least one enabled row with Portal ID and destination.', 'trulle-portal-elementor' ) . '</div>';
			return;
		}

		$payload = wp_json_encode( $portals, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( ! is_string( $payload ) ) {
			return;
		}

		echo '<div class="trulle-portal-root" data-trulle-portal-root="1" data-portals="' . esc_attr( $payload ) . '"></div>';
	}
}
