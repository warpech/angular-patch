<?php

function isLampOn($lamp) {
  return ($lamp['State'] == true);
}

function applicationStart() {
  $first = array("Al", "Fred", "Steve", "Joe", "Frank", "Paul");
  $last = array("Bundy", "Flintstone", "Jobs", "Biden", "Sinatra", "McCartney");
  setProp('FirstName', $first[array_rand($first)]);
  setProp('LastName', $last[array_rand($last)]);
}

function applicationLogic() {
  setProp('FullName', getProp('FirstName') . ' ' . getProp('LastName'));

  $Address = getProp('Address');
  if (!empty($Address['Street']) && !empty($Address['City'])) {
    setProp('FullName', getProp('FullName') . ', from ' . $Address['Street'] . ' in ' . $Address['City']);
  }
  else if (!empty($Address['City'])) {
    setProp('FullName', getProp('FullName') . ', from ' . $Address['City']);
  }
  else if (!empty($Address['Street'])) {
    setProp('FullName', getProp('FullName') . ', from ' . $Address['Street']);
  }

  $myTextBox = getProp('MyTextBox');
  if (empty($myTextBox)) {
    setProp('MyMessage', "Please put something to text box");
  }
  else if ($myTextBox == "I am typing something") {
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