<?php
/**
 * Plugin Name: Trulle Portal Elementor
 * Description: Elementor widget for GUI-based Trulle portal configuration.
 * Version: 0.1.0
 * Author: Trulle
 * Text Domain: trulle-portal-elementor
 *
 * Requires Plugins: elementor
 * Elementor tested up to: 3.35.0
 * Elementor Pro tested up to: 3.35.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TRULLE_PORTAL_ELEMENTOR_VERSION', '0.1.0' );
define( 'TRULLE_PORTAL_ELEMENTOR_PATH', plugin_dir_path( __FILE__ ) );
define( 'TRULLE_PORTAL_ELEMENTOR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register frontend assets.
 */
function trulle_portal_register_assets() {
	$css_file = TRULLE_PORTAL_ELEMENTOR_PATH . 'assets/portal-nav.css';
	$js_file  = TRULLE_PORTAL_ELEMENTOR_PATH . 'assets/portal-nav.iife.js';
	$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : TRULLE_PORTAL_ELEMENTOR_VERSION;
	$js_ver   = file_exists( $js_file ) ? (string) filemtime( $js_file ) : TRULLE_PORTAL_ELEMENTOR_VERSION;

	wp_register_style(
		'trulle-portal-nav',
		TRULLE_PORTAL_ELEMENTOR_URL . 'assets/portal-nav.css',
		array(),
		$css_ver
	);

	wp_register_script(
		'trulle-portal-nav',
		TRULLE_PORTAL_ELEMENTOR_URL . 'assets/portal-nav.iife.js',
		array(),
		$js_ver,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'trulle_portal_register_assets' );

/**
 * Register Elementor widget.
 *
 * @param \Elementor\Widgets_Manager $widgets_manager Widgets manager.
 */
function trulle_portal_register_widgets( $widgets_manager ) {
	require_once TRULLE_PORTAL_ELEMENTOR_PATH . 'widgets/class-trulle-portal-config-widget.php';

	$widgets_manager->register( new \Trulle_Portal_Config_Widget() );
}
add_action( 'elementor/widgets/register', 'trulle_portal_register_widgets' );
