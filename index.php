<?php
include "php/lib/JsonPatch.php";
include "php/session.php";

$injectEliminateRequest = true;

if(empty($_SERVER['PATH_INFO'])){
	header('Location: ' . $_SERVER['REQUEST_URI'] . '/');
	die();
}

$patchOutput = array();
$path = $_SERVER['PATH_INFO'];
$method = $_SERVER['REQUEST_METHOD'];
if(substr_count($_SERVER['HTTP_ACCEPT'], 'application/json')) {
	$accept = 'json';
}
else if(substr_count($_SERVER['HTTP_ACCEPT'], 'text/html')) {
	$accept = 'html';
}

$__vm = '';
preg_match('/^\/__vm\/(.*)$/', $path, $matches);
if(!empty($matches[1])) {
	$__vm = $matches[1];
}

if(empty($_SESSION['data'])) {
	restartSession();
}

function isLampOn($lamp) {
	return ($lamp['State'] == true);
}

function applicationLogic() {
	setProp('FullName', getProp('FirstName') . ' ' . getProp('LastName'));
	
	$Address = getProp('Address');
	if(!empty($Address['Street']) && !empty($Address['City'])) {
		setProp('FullName', getProp('FullName') . ', from ' . $Address['Street'] . ' in ' . $Address['City']);
	}
	else if(!empty($Address['City'])) {
		setProp('FullName', getProp('FullName') . ', from ' . $Address['City']);
	}
	else if(!empty($Address['Street'])) {
		setProp('FullName', getProp('FullName') . ', from ' . $Address['Street']);
	}
	
	$myTextBox = getProp('MyTextBox');
	if(empty($myTextBox)) {
		setProp('MyMessage', "Please put something to text box");
	}
	else if($myTextBox == "I am typing something") {
		setProp('MyTextBox', "hello world");
		setProp('MyMessage', "You are not allowed to type that");
	}
	else {
		setProp('MyMessage', "I got it, " . $myTextBox . "!");
	}
	
	$lamps = getProp('Lamps');
	$total = count($lamps);
	$on = count(array_filter($lamps, 'isLampOn'));
	setProp('LampSummary', 'I have ' . ($total - $on) . ' lamps off and ' . $on . ' lamps on.');
}

if($accept == 'html' && $method == 'GET' && $path == "/test" ) {
	restartSession();
	applicationLogic();
	include "html/index.html";
}
else if($accept == 'html' && $method == 'GET') {
	include "html/404.html";
}
else if($accept == 'json' && $__vm != getProp('View-Model')) {
	header(':', true, 401);
	echo json_encode(array("error" => "wrong __vm param '{$__vm}'"));
}
else if($accept == 'json' && $method == 'GET') {
	applicationLogic();
	echo json_encode($_SESSION['data']);
}
else if($accept == 'json' && $method == 'PATCH') {
	$post = file_get_contents('php://input');
	$patchInput = json_decode($post, true);
	
	try {
	  $_SESSION['data'] = @JsonPatch::patch($_SESSION['data'], array($patchInput));	  
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


//echo phpinfo();