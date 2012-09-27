<?php
include "lib/JsonPatch.php";

session_start();

function restartSession() {
	$jsonFile = file_get_contents('data.json');
	$_SESSION['data'] = json_decode($jsonFile, true);
	
	$first = array("Al", "Fred", "Steve", "Joe", "Frank", "Paul");
	$last = array("Bundy", "Flintstone", "Jobs", "Biden", "Sinatra", "McCartney");
	$_SESSION['data']['FirstName'] = $first[array_rand($first)];
	$_SESSION['data']['LastName'] = $last[array_rand($last)];
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

if(empty($_SESSION['data'])) {
	restartSession();
}

$patchOutput = array();

function applicationLogic() {
	setProp('FullName', getProp('FirstName') . ' ' . getProp('LastName'));
	
	$myTextBox = getProp('MyTextBox');
	if(empty($myTextBox)) {
		setProp('MyMessage', "Please put something to text box");
	}
	else {
		setProp('MyMessage', "I got it, " . $myTextBox . "!");
	}
}

if($_SERVER['REQUEST_METHOD'] === 'GET') {
	if(isset($_GET['restartSession'])) {
		restartSession();
		echo json_encode(array("result" => "ok"));
	}
	else {
		applicationLogic();
		echo json_encode($_SESSION['data']);
	}
}
else if($_SERVER['REQUEST_METHOD'] === 'PATCH') {
	$post = file_get_contents('php://input');
	$patchInput = json_decode($post, true);
	
	$_SESSION['data'] = JsonPatch::patch($_SESSION['data'], array($patchInput));	
	applicationLogic();
	echo json_encode($patchOutput);
}


//echo phpinfo();