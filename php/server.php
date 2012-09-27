<?php

include "lib/JsonPatch.php";

session_start();

function restartSession() {
	$jsonFile = file_get_contents('data.json');
	$_SESSION['data'] = json_decode($jsonFile, true);
}

function setProp($key, $val) {
	$_SESSION['data'][$key] = $val;
}

function getProp($key) {
	return $_SESSION['data'][$key];
}

if(empty($_SESSION['data'])) {
	restartSession();
}

function applicationLogic() {
	setProp('FullName', getProp('FirstName') . ' ' . getProp('LastName'));

	return array(
		array(
			'replace' => '/FullName',
			'value' => $_SESSION['data']['FullName']		
		)
	);
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
	$patchOutput = applicationLogic();
	
	echo json_encode($patchOutput);
}


//echo phpinfo();