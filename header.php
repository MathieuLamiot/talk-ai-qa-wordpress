<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<header role="banner" class="site-header">
  <div class="container">
    <a href="<?php echo esc_url(home_url('/')); ?>">AI for QA in WordPress</a>
    <nav role="navigation" aria-label="Main" data-testid="primary-nav">
      <?php
        wp_nav_menu([
          'theme_location' => 'primary',
          'container' => false,
          'menu_class' => 'menu',
          'fallback_cb' => false
        ]);
      ?>
    </nav>
    <a href="<?php echo esc_url(home_url('/get-started')); ?>" class="btn cta">Get Started</a>
  </div>
</header>
<main role="main" class="site-main">