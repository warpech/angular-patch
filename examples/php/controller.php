<?php

require 'examples/php/lib/FirePHPCore/FirePHP.class.php';
session_start();

$path = $_SERVER['PATH_INFO'];
if (empty($path)) {
  header('Location: ' . $_SERVER['REQUEST_URI'] . '/');
  die();
}

$__vm = '';
preg_match('/^\/__vm\/(.*)$/', $path, $matches);
if (!empty($matches[1])) {
  $__vm = $matches[1];
}

if (!empty($__vm) && !empty($_SESSION['appName'])) {
  $appName = $_SESSION['appName'];
}
else {
  $appName = substr(strrchr($path, '/'), 1); //get everything after last slash (/test => test)
}

$tplPath = "examples/app/{$appName}.html";
$jsonPath = "examples/app/{$appName}.json";
$appPath = "examples/app/{$appName}.php";

if (!(preg_match('/^[a-zA-Z0-9_]+$/', $appName) && file_exists($tplPath) && file_exists($jsonPath) && file_exists($appPath))) {
  include "examples/php/tpl/404.html";
  die();
}

$injectEliminateRequest = true;

include 'examples/php/session.php';
include $appPath;

$patchOutput = array();
$method = $_SERVER['REQUEST_METHOD'];
if (substr_count($_SERVER['HTTP_ACCEPT'], 'application/json')) {
  $accept = 'json';
}
else if (substr_count($_SERVER['HTTP_ACCEPT'], 'text/html') || substr_count($_SERVER['HTTP_ACCEPT'], '*/*')) { //*/* is IE8
  $accept = 'html';
}

if ($accept == 'html' && $method == 'GET') {
  restartSession();
  applicationStart();
  applicationLogic();
  include $tplPath;
}
else if ($accept == 'json' && $__vm != getProp('View-Model')) {
  header(':', true, 401);
  echo json_encode(array("error" => "wrong __vm param '{$__vm}' should be '" . getProp('View-Model') . "'"));
}
else if ($accept == 'json' && $method == 'GET') {
  applicationLogic();
  echo json_encode($_SESSION['data']);
}
else if ($accept == 'json' && $method == 'PATCH') {
  $post = file_get_contents('php://input');
  $patchInput = json_decode($post, true);
  if (!is_array($patchInput) || !array_key_exists(0, $patchInput)) {
    $patchInput = array($patchInput);
  }
  try {
    $sanitized = array();
    foreach ($patchInput as $key => $value) {
      if ($patchInput[$key]['op'] === 'replace' && $patchInput[$key]['path'] === '/View-Model') {
        unset($patchInput[$key]);
      }
    }
    $_SESSION['data'] = @JsonPatch::patch($_SESSION['data'], $patchInput);
  }
  catch (Exception $e) {
    header(':', true, 404);
    $patchOutput = array(
        "error" => $e->getMessage()
    );
  }

  applicationLogic();
  echo json_encode($patchOutput);
}
else {
  include "examples/php/tpl/404.html";
}