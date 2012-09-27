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

function setProp($key, $val) {
	global $patchOutput;
	$_SESSION['data'][$key] = $val;
	array_push($patchOutput, array(
		'replace' => '/' . $key,
		'value' => $val		
	));
}

function getProp($key) {
	if(isset($_SESSION['data'][$key])) {
		return $_SESSION['data'][$key];
	}
	else {
		return null;
	}
}