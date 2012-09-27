<?php
include "lib/JsonPatch.php";

session_start();

function restartSession() {
	$jsonFile = file_get_contents('data.json');
	$_SESSION['data'] = json_decode($jsonFile, true);
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
	return $_SESSION['data'][$key];
}

if(empty($_SESSION['data'])) {
	restartSession();
}

$patchOutput = array();

function applicationLogic() {
	setProp('FullName', getProp('FirstName') . ' ' . getProp('LastName'));
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
else if($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
	$post = file_get_contents('php://input');
	$patchInput = json_decode($post, true);
	
	$_SESSION['data'] = JsonPatch::patch($_SESSION['data'], array($patchInput));	
	applicationLogic();
	echo json_encode($patchOutput);
}


//echo phpinfo();