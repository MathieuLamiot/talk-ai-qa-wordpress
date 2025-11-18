<?php
// Enqueue styles
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style('mcp-theme', get_template_directory_uri() . '/assets/theme.css', [], '0.1.0');
  if (is_page('pricing')) {
    wp_enqueue_style('mcp-pricing', get_template_directory_uri() . '/assets/pricing.css', ['mcp-theme'], '0.1.0');
  }
});

// Register menu
add_action('after_setup_theme', function () {
  register_nav_menus([
    'primary' => __('Primary Menu', 'mcp-minimal'),
  ]);
  add_theme_support('title-tag');
});

// Simple REST route (used in PR-A refactor)
add_action('rest_api_init', function () {
  register_rest_route('mcp/v1', '/ping', [
    'methods'  => 'GET',
    'callback' => function () {
      return ['ok' => true, 'ts' => time()];
    }
  ]);
});


// Rename "Promo" menu item label to "Deals" in the Primary menu (demo of intentional UI change)
add_filter('wp_nav_menu_objects', function ($items, $args) {
  if (!isset($args->theme_location) || $args->theme_location !== 'primary') {
    return $items;
  }
  foreach ($items as $item) {
    if (trim($item->title) === 'Promo') {
      $item->title = 'Deals';
    }
  }
  return $items;
}, 10, 2);
