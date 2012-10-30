<?php

$products = array('Big Mac', 'Big Mac & Co', 'McRoyal', 'McRoyal with Cheese', 'FishMac', 'Cheeseburger', 'Double Cheeseburger', 'Hamburger', 'McCountry', 'McChicken');

function applicationStart() {
  $items = getProp('Items');
  array_push($items, getProductSchema()); //add empty row to the table
  setProp('Items', $items);
}

function patchMentions($key) {
  global $patchInput;
  if (!empty($patchInput)) {
    foreach ($patchInput as $update) {
      if (strpos($update['replace'], $key) === 0) {
        return true;
      }
    }
  }
  return false;
}

function applicationLogic() {
  global $products;

  if (patchMentions('/AddRow$')) {
    $items = getProp('Items');
    array_push($items, getProductSchema()); //add empty row to the table
    setProp('Items', $items);
  }

  if (patchMentions('/Items')) {
    $items = getProp('Items');
    foreach ($items as $key => $item) {
      if (!empty($item['Product']['_Search$'])) {
        $items[$key]['Product']['_Options'] = array();
        foreach ($products as $product) {
          if (strpos(strtolower($product), strtolower($item['Product']['_Search$'])) !== false) {
            array_push($items[$key]['Product']['_Options'], array(
                'Description' => $product,
                'Image' => '',
                'Pick$' => null
            ));
          }
        }
      }
    }
    setProp('Items', $items);
  }

  $count = 0;
  foreach (getProp('Items') as $item) {
    $count += (int) $item['Quantity$'];
  }
  setProp('TotalQuantity', $count);
  $firephp = FirePHP::getInstance(true);
  $firephp->log(getProp('Items'), 'php items');
}

function getProductSchema() {
  global $jsonPath, $appName;
  $jsonFile = file_get_contents($jsonPath);
  $data = json_decode($jsonFile, true);
  $schema = nullify($data['Items'][0]);
  return $schema;
}

function nullify($obj) {
  switch (gettype($obj)) {
    case 'array':
      $return = array();
      foreach (array_keys($obj) as $key) {
        $return[$key] = nullify($obj[$key]);
      }
      return $return;
      break;

    default:
      return null;
  }
}

/*
{
    "Product": {
      "_Search$":"Big M",
      "_Options": [
      {
        "Description":"Big Mac", 
        "Image":"bigmac.png", 
        "Pick$":null
      },
      {
        "Description":"Big Mac & Co", 
        "Image":"bigmac_co.png", 
        "Pick$":null
      }					
      ]
    }
 */