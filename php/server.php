<?php
include "lib/JsonPatch.php";
include "session.php";

$patchOutput = array();
$method = $_SERVER['REQUEST_METHOD'];
if(substr_count($_SERVER['HTTP_ACCEPT'], 'application/json')) {
	$accept = 'json';
}
else if(substr_count($_SERVER['HTTP_ACCEPT'], 'text/html')) {
	$accept = 'html';
}

if(empty($_SESSION['data'])) {
	restartSession();
}

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

if($accept == 'html' && $method === 'GET') {
	include "template/index.html";
}
if($accept == 'json' && $method === 'GET') {
	if(isset($_GET['restartSession'])) {
		restartSession();
		echo json_encode(array("result" => "ok"));
	}
	else {
		applicationLogic();
		echo json_encode($_SESSION['data']);
	}
}
else if($accept == 'json' && $method === 'PATCH') {
	$post = file_get_contents('php://input');
	$patchInput = json_decode($post, true);
	
	$_SESSION['data'] = JsonPatch::patch($_SESSION['data'], array($patchInput));	
	applicationLogic();
	echo json_encode($patchOutput);
}


//echo phpinfo();