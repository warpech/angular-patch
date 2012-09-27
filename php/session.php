<?php
session_start();

function restartSession() {
	$jsonFile = file_get_contents('php/data.json');
	$_SESSION['data'] = json_decode($jsonFile, true);
	
	$first = array("Al", "Fred", "Steve", "Joe", "Frank", "Paul");
	$last = array("Bundy", "Flintstone", "Jobs", "Biden", "Sinatra", "McCartney");
	$_SESSION['data']['FirstName'] = $first[array_rand($first)];
	$_SESSION['data']['LastName'] = $last[array_rand($last)];
	$_SESSION['data']['View-Model'] = session_id();
}

function addToPatchOutput($path, $val) {
	global $patchOutput;
	foreach($patchOutput as $key => $value) {
		if($patchOutput[$key]['replace'] == $path) {
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
	if($_SESSION['data'][$key] != $val) {
		$_SESSION['data'][$key] = $val;
		addToPatchOutput('/' . $key, $val);
	}
}

function getProp($key) {
	if(isset($_SESSION['data'][$key])) {
		return $_SESSION['data'][$key];
	}
	else {
		return null;
	}
}