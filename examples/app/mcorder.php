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
      if (!empty($update['replace']) && strpos($update['replace'], $key) === 0) {
        return true;
      }
    }
  }
  return false;
}

function applicationLogic() {
  global $products, $patchInput;
  $firephp = FirePHP::getInstance(true);

  if (patchMentions('/AddRow$')) {
    $items = getProp('Items');
    array_push($items, getProductSchema()); //add empty row to the table
    setProp('Items', $items);
  }

  if (patchMentions('/Items')) {
    $items = getProp('Items');

    foreach ($patchInput as $update) {
      if (!empty($update['replace'])) {
        $split = explode('/', $update['replace']);
        if ($split[count($split) - 1] === 'Pick$') {
          $optionId = (int) $split[count($split) - 2];
          $itemId = (int) $split[count($split) - 5];
          $items[$itemId]['Product']['_Search$'] = $items[$itemId]['Product']['_Options'][$optionId]['Description'];
          $firephp->log($items[$itemId]['Product']['_Search$'], 'search');
        }
      }
    }

    foreach ($items as $key => $item) {
      if (!empty($item['Product']['_Search$'])) {
        $items[$key]['Product']['_Options'] = array();
        foreach ($products as $product) {
          if (strpos(strtolower($product), strtolower($item['Product']['_Search$'])) !== false) {
            array_push($items[$key]['Product']['_Options'], array(
                'Description' => $product,
                'Image' => '//a248.e.akamai.net/assets.github.com/images/icons/emoji/hamburger.png',
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