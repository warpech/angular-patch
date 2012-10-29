<?php

function applicationStart() {
  $items = getProp('Items');
  array_push($items, getProductSchema()); //add empty row to the table
  setProp('Items', $items);
}

function applicationLogic() {
  global $addRowRequest;
  if (!empty($addRowRequest)) {
    $items = getProp('Items');
    array_push($items, getProductSchema()); //add empty row to the table
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