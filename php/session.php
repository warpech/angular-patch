<?php

function restartSession() {
  global $jsonPath, $appName;
  $jsonFile = file_get_contents($jsonPath);
  $_SESSION['appName'] = $appName;
  $_SESSION['data'] = json_decode($jsonFile, true);
  $_SESSION['data']['View-Model'] = session_id();
}

function addToPatchOutput($path, $val) {
  global $patchOutput;
  foreach ($patchOutput as $key => $value) {
    if ($patchOutput[$key]['replace'] == $path) {
      $patchOutput[$key]['value'] = $val;
      return;
    }
  }
  array_push($patchOutput, array(
      'replace' => $path,
      'value' => $val
  ));
}

function setProp($key, $val) {
  if ($_SESSION['data'][$key] != $val && $key !== 'View-Model') {
    $_SESSION['data'][$key] = $val;
    addToPatchOutput('/' . $key, $val);
  }
}

function getProp($key) {
  if (isset($_SESSION['data'][$key])) {
    return $_SESSION['data'][$key];
  }
  else {
    return null;
  }
}