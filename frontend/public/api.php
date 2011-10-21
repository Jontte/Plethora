<?php

require_once('../php/config.php');
require_once('../php/third_party/recaptchalib.php');

if ( isset($_REQUEST['plaintext']) )
	header('Content-type: text/plain');
else
	header('Content-type: text/json');

function reqparam($key){
	if ( isset($_REQUEST[$key]) )
		return $_REQUEST[$key];
	return '';
}

function output($data){
	global $plethora_debug;
	
	if ( is_bool($data) )
		$data = array('ok'=>$data);
	
	die(json_encode($data, ($plethora_debug && defined('JSON_PRETTY_PRINT')) ? JSON_PRETTY_PRINT : 0));
}
function error($text, array $stuff=array()){
	output(array_merge(array(
		'error' => $text
	), $stuff));
}

$dbh = new PDO(
		"mysql:host={$plethora_mysql['host']};dbname={$plethora_mysql['database']}",
		$plethora_mysql['username'],
		$plethora_mysql['password']
);

function sql($query, array $params = array(), $numToFetch = null, &$insertID = null){
	global $dbh;
	global $plethora_debug;
	
	if ( count($params) > 0 ){
		$stmt = $dbh->prepare($query);
		foreach ( $params as $key=>$value ){
			if ( strpos($query, $key) === false )
				continue;
			
			if ( !is_array($value) )
				$value = array('val' => $value, 'type' => PDO::PARAM_STR);
			
			$stmt->bindParam($key, $value['val'], $value['type']);
		}
		
		if ( !$stmt->execute() ){
			if ( $plethora_debug )
				print_r($stmt->errorInfo());
			return false;
		}
	}
	else
		$stmt = $dbh->query($query);
	
	if ( !$stmt ){
		if ( $plethora_debug )
			print_r($stmt->errorInfo());
		return false;
	}
	
	$insertID = $dbh->lastInsertId();
	
	if ( $numToFetch === 0 )
		return true;
	
	$results = array();
	while ( $row = $stmt->fetch(PDO::FETCH_ASSOC) )
		$results []= $row;
	
	if ( $numToFetch === 1 ){
		if ( isset($results[0]) )
			return $results[0];
		return null;
	}
	elseif ( $numToFetch > 0 )
		return array_slice($results, 0, $numToFetch);
	
	return $results;
}

function checkCaptcha(){
	global $plethora_recaptcha;
	
	return recaptcha_check_answer($plethora_recaptcha['private'], $_SERVER['REMOTE_ADDR'], reqparam('captcha_challenge'), reqparam('captcha_response'));
}

function handleRequest($action){
	switch ( $action ){
		case 'getLevelList': // [uid], [orderBy], [orderDir]
			$orderDirs = array(
				'id' => 'ASC',
				'playcount' => 'DESC',
				'updated' => 'DESC',
				'name' => 'ASC',
				'user_id' => 'DESC'
			);
			
			$orderBy = reqparam('orderBy');
			if ( !in_array($orderBy, array_keys($orderDirs)) )
				$orderBy = 'id';
			
			$orderDir = reqparam('orderDir');
			if ( !in_array($orderDir, array('ASC', 'DESC')) )
				$orderDir = $orderDirs[$orderBy];
			
			$data = sql('SELECT levels.id, UNIX_TIMESTAMP(levels.updated) AS updated, levels.name, levels.desc, levels.user_id, users.username
							FROM levels
							LEFT JOIN users ON levels.user_id=users.id
							WHERE 1
							'.(reqparam('uid') ? (' AND levels.user_id=:uid') : '').'
							ORDER BY levels.'.$orderBy.' '.$orderDir,
			array(
				':uid' => reqparam('uid')
			));
			
			output(array(
				'levels' => $data
			));
		break;
		case 'getLevel': // id
			$data = sql('SELECT levels.id,  UNIX_TIMESTAMP(levels.updated) AS updated, levels.name, levels.desc, levels.data, levels.user_id, users.username
							FROM levels
							LEFT JOIN users ON levels.user_id=users.id
							WHERE levels.id=:id
							LIMIT 1',
			array(
				':id' => reqparam('id')
			), 1);
			output($data);
		break;
		case 'saveLevel': // sid, [id], name, [desc], data
			$user = sql('SELECT users.id FROM users, sessions WHERE sessions.id=:sid AND users.id=sessions.user_id LIMIT 1', array(
				':sid' => reqparam('sid')
			), 1);
			if ( !$user )
				error('Invalid session!');
			
			if ( reqparam('id') == 'null' )
				$_REQUEST['id'] = null;
			
			if ( reqparam('id') ){
				$oldlevel = sql('SELECT id, user_id FROM levels WHERE id=:id', array(
					':id' => reqparam('id')
				), 1);
				if ( !$oldlevel )
					$_REQUEST['id'] = null;
				elseif ( $oldlevel['user_id'] != $user['id'] )
					error('Trying to overwrite another user\'s level!');
			}
			
			sql('INSERT INTO levels ('.(reqparam('id')?'`id`, ':'').'`user_id`, `name`, `desc`, `data`)
					VALUES('.(reqparam('id')?':id, ':'').':uid, :name, :desc, :data)
					ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), `name`=:name, `desc`=:desc, `data`=:data',
			array(
				':id' => reqparam('id'),
				':uid' => array('val'=>$user['id'], 'type'=>PDO::PARAM_INT),
				':name' => reqparam('name'),
				':desc' => reqparam('desc'),
				':data' => reqparam('data')
			), 1, $insertID);
			
			output(array(
				'id' => $insertID
			));
		break;
		case 'getUserData': // uid
			$data = sql('SELECT id, username, (SELECT COUNT(*) FROM levels WHERE user_id=:uid) AS level_count FROM users WHERE id=:uid', array(
				':uid' => reqparam('uid')
			), 1);
			output($data);
		break;
		case 'getSessionData': // sid
			$data = sql('SELECT users.id, users.username, sessions.id AS sid FROM users, sessions WHERE sessions.id=:sid AND users.id=sessions.user_id LIMIT 1', array(
				':sid' => reqparam('sid')
			), 1);
			
			if ( !empty($data) )
				output($data);
			else
				error('Invalid session!');
		break;
		case 'logout': // sid
			sql('DELETE FROM sessions WHERE id=:sid LIMIT 1', array(
				':sid' => reqparam('sid')
			), 0);
			
			output(true);
		break;
		case 'login': // username, password
			// Get user info
			$data = sql('SELECT id, username FROM users WHERE username=:username AND password=:password LIMIT 1', array(
				':username' => reqparam('username'),
				':password' => reqparam('password')
			), 1);
			
			if ( !empty($data) ){
				// Create a new session
				$data['sid'] = uniqid('', true);
				sql('INSERT INTO sessions (id, user_id) VALUES(:sid, :uid)', array(
					':sid' => $data['sid'],
					':uid' => $data['id']
				), 0);
				
				// Limit to 5 open sessions per user
				sql('DELETE FROM sessions WHERE user_id=:uid AND id NOT IN ( SELECT id FROM ( SELECT id FROM sessions WHERE user_id=:uid ORDER BY created DESC LIMIT 5 ) foo )', array(
					':uid' => $data['id']
				), 0);
				
				output($data);
			}
			else
				error('Invalid username or password!');
		break;
		case 'register': // usrename, password, captcha_challenge, captcha_response
			// Check captcha
			$resp = checkCaptcha();
			if ( !$resp->is_valid )
				error('Invalid CAPTCHA answer!');
			
			// Check if username exists
			$data = sql('SELECT * FROM users WHERE username=:username LIMIT 1', array(
				':username' => reqparam('username')
			));
			if ( count($data) > 0 )
				error('Username already taken!');
			
			// Create new user
			sql('INSERT INTO users (username, password) VALUES(:username, :password)', array(
				':username' => reqparam('username'),
				':password' => reqparam('password')
			), 0);

			return handleRequest('login');
		break;
		default:
			error('Invalid action');
	}
}

handleRequest(reqparam('action'));
