<?php
/*
 * LICENSE: Redistribution and use in source and binary forms, with or
 * without modification, are permitted provided that the following
 * conditions are met: Redistributions of source code must retain the
 * above copyright notice, this list of conditions and the following
 * disclaimer. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
 * NO EVENT SHALL CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
 * OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
 * USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
 * DAMAGE.
 *
 * @author maq128
 * @version v0.5
 * @last-modified 2011-9-21 18:05
 */

/**
 * RealtimeNotifyBase ���װ�ˡ�TOP ����ҵ�����ͷ��񡱵Ļ��������߼���
 * 
 * �ο����ϣ�
 * 
 *   TOP - Stream API����
 *   http://dev.open.taobao.com/dev/index.php/Stream_API%E4%BB%8B%E7%BB%8D
 * 
 *   TOP - ����֪ͨҵ�� API������ API��
 *   http://open.taobao.com/doc/api_cat_detail.htm?cat_id=39&category_id=102
 * 
 * ��ƿ��ǣ�
 * 
 *   1. Ϊ�������������ԭ���´����жϺ�ĳ�ʱ����У�������Ӧ������һ���Ƚ�С��
 *      �������������У����� 5 ���ӣ���
 * 
 *   2. ��������������ͨ��������ֹ����������ʵ����ֱ��һ��ʱ���ȱʡΪ 23.5 Сʱ��
 *      ����������ڶ���ʵ�����У���ǰһ���������߳������ս�����ǰһ��ʵ���˳���
 * 
 * һ���÷���
 * 
 *   RealtimeNotifyBase �����Ŀ���Ƿ�װ�ײ�Ĵ����߼������ṩ��һ����չ�ܹ����䱾��
 *   �����ʺ�ֱ��ʹ�á�
 * 
 *   һ���Ӧ�ó���Ҫʹ��������ܣ���Ҫ���������չ����������ҵ����Ϣ�����߼�������
 *   ���á�����֪ͨҵ�� API����ȡ��ʧ��ҵ����Ϣ����
 * 
 *   RealtimeNotifySimple ��һ����򵥵���չ���ӣ���ʵ�������ڳ��˰�ҵ����Ϣ����ʾ��
 *   �������ʲôҲû��������������޸������������Լ��Ĵ����߼���
 * 
 *   RealtimeNotifyForward �����չ�࣬���Զ�ҵ����Ϣ������ת�����൱���ǰѴӳ����ӷ�ʽ
 *   �յ���ҵ����Ϣת��Ϊ�ص���ַ��֪ͨ��ʽ�����Ҫ����������Ҫ�Լ�����ʵ�� web ������
 *   ���ղ�����ת�������ݡ�
 * 
 *   �� RealtimeNotifyForward Ϊ���������ӽ��ճ���һ���������ģ�
 * 
 *      $rn = new RealtimeNotifyForward();
 *      $rn->setConfig( 'app_key', '���� appkey' );
 *      $rn->setConfig( 'secret', '��������㶮�� :)' );
 *      $rn->setConfig( 'forward_host', 'localhost' );
 *      $rn->setConfig( 'forward_path', '/forward_notify' );
 *      $rn->setConfig( 'forward_headers', 'X_REQUESTED_WITH: RealtimeNotifyForward' );
 *      $rn->run();
 * 
 *   Ȼ���ڲ���ϵͳ�����ú�̨����Linux ������� cron����ÿ 5 ��������ִ���������
 *   ���ԵĻ��������������� CLI ��ʽ���С�
 */
class RealtimeNotifyBase
{
	protected $config;
	protected $fnLock;
	protected $fpLock;
	protected $tsUnlock;

	/**
	 * �������ò�����
	 */
	public function setConfig( $name, $value )
	{
		if ( ! is_array( $this->config ) ) {
			$this->config = array();
		}
		$oldvalue = $this->config[$name];
		$this->config[$name] = $value;
		return $oldvalue;
	}

	public function __construct()
	{
		// TOP ��������ز���
		$this->setConfig( 'server_host', 'stream.api.taobao.com' );
		$this->setConfig( 'server_port', 80 );
		$this->setConfig( 'server_path', '/stream' );
		$this->setConfig( 'server_timeout', 30 );

		// �������в���

		// ��������Ҫ�������ļ�����д�����Ŀ¼��
		$this->setConfig( 'writable_dir', dirname(__FILE__) );

		// �ļ���
		$this->setConfig( 'lock_file', 'rn.lock' );
		$this->setConfig( 'lock_time', 60 * 60 * 23.5 );

		// Ӧ�ñ�ʶ
		$this->setConfig( 'app_key', '--------' );
		$this->setConfig( 'secret', '--------------------------------' );

		// ����ض��û�������ͨ��
		$this->setConfig( 'user_id', null );
	}

	/**
	 * ������ѭ�����÷������غ󣬳���Ӧ�ý������С�
	 */
	public function run()
	{
		// ����
		if ( ! $this->enterLock() ) {
			return;
		}

		$fp = @fsockopen( $this->config['server_host'], $this->config['server_port'], $errno, $errstr, 30 );
		if ( ! $fp ) {
			$this->outputDebug( "[errno:{$errno}] {$errstr}\r\n" );
			return;
		}

		stream_set_timeout( $fp, intval( $this->config['server_timeout'] * 2.5 ) );

		$timestamp = date( 'Y-m-d H:i:s', time() );

		$str = "app_key{$this->config['app_key']}timestamp{$timestamp}";
		$content = "app_key=" . $this->config['app_key'] ."&timestamp=" . urlencode($timestamp);
		if ( !empty($this->config['user_id']) ) {
			$str .= "user{$this->config['user_id']}";
			$content .= "&user={$this->config['user_id']}";
		}
		$sign = strtoupper( md5( "{$this->config['secret']}{$str}{$this->config['secret']}", false ) );
		$content .= "&sign=" . $sign;

		$contentLength = strlen($content);

		$out = "POST {$this->config['server_path']} HTTP/1.1\r\n";
		$out .= "Host: {$this->config['server_host']}\r\n";
		$out .= "Content-Type: application/x-www-form-urlencoded\r\n";
		$out .= "Content-Length: {$contentLength}\r\n";
		$out .= "Connection: Keep-Alive\r\n\r\n";
		$out .= $content;

		$len = fwrite( $fp, $out );
		$this->outputDebug( "������ {$len} �ֽ�\r\n{$out}\r\n" );

		while ( $len ) {
			$line = fgets( $fp );
	
			$meta = stream_get_meta_data( $fp );
			if ( $meta['timed_out'] ) {
				// �����ʱδ�����κ����ݣ�����Ϊ������ϣ��������˳�
				$this->outputDebug( "���ӽ��ճ�ʱ\r\n" );
				break;
			}

			if ( $meta['eof'] ) {
				$this->outputDebug( "���ӱ��ر�\r\n" );
				break;
			}

			if ( strlen($line) == 0 ) {
				$this->outputDebug( "û���յ����ݣ���\r\n" );
				break;
			}

			$this->outputDebug( $line );

			// ˢ����״̬
			$this->checkLock();

			// ����� json ���ݣ�����
			if ( $line[0] == '{' ) {

				// �ԡ�����ֵ������˫���ţ����� json_decode ʱ���
				$line = preg_replace( '/([":])([0-9]+)([,}])/isU', '${1}"${2}"${3}', $line );

				if ( $this->dispatchPacket( $line ) ) {
					break;
				}
			}
		}
		fclose($fp);
	}

	/**
	 * ���������Ϣ��
	 * ��ʽ���ߵ�ʱ�򣬿��Կ��ǰ���������ע�͵���
	 */
	protected function outputDebug( $txt )
	{
		$ts = date( 'Y-m-d H:i:s', time() );
		echo "[{$ts}] {$txt}";
	}

	/**
	 * ��������ֹ������ĵڶ���ʵ���������С�
	 */
	private function enterLock()
	{
		$this->outputDebug( "��������\r\n" );

		$this->fnLock = $this->config['writable_dir'] . DIRECTORY_SEPARATOR . $this->config['lock_file'];
		if ( !empty($this->config['user_id']) ) {
			$this->fnLock .= ".{$this->config['user_id']}";
		}

		$this->fpLock = fopen( $this->fnLock, 'w+' );
		if ( $this->fpLock ) {
			if ( flock( $this->fpLock, LOCK_EX | LOCK_NB ) ) {
				$this->tsUnlock = time() + $this->config['lock_time'];
				return true;
			}
			fclose( $this->fpLock );
			$this->fpLock = null;
		}

		$this->outputDebug( "    ����ʧ��\r\n" );

		return false;
	}

	/**
	 * ˢ����״̬��
	 * ������������ڣ����������������ĵڶ���ʵ���������С���ִ�еĳ���ᵼ����ǰ�ĳ������жϣ�����ʹ�����˳���
	 */
	private function checkLock()
	{
		if ( ! $this->fpLock ) {
			return;
		}

		if ( time() < $this->tsUnlock ) {
			return;
		}

		$this->outputDebug( "����\r\n" );

		flock( $this->fpLock, LOCK_UN );
		fclose( $this->fpLock );
		$this->fpLock = null;

		unlink( $this->fnLock );
	}

	/**
	 * ������Ϣ�������ͷֱ���
	 * @param string $json - json �ַ�����
	 * @return boolean - true ��ʾ��Ҫ�ر����Ӳ��˳��������
	 */
	private function dispatchPacket( $json )
	{
		$json = json_decode( $json, true );

		if ( ! isset($json['packet']) ) {
			return false;
		}
		$packet = $json['packet'];

		$method = "onPacket{$packet['code']}";
		if ( method_exists( $this, $method ) ) {
			return $this->$method( $packet['msg'] );
		}

		$this->outputDebug( "δ֪����Ϣ\r\n" );
		return false;
	}

	protected function onPacket200( $msg )
	{
		// $this->outputDebug( "���ӳɹ�\r\n" );
		// app����Ϊ��׼����ȡ������
	}

	protected function onPacket201( $msg )
	{
		// $this->outputDebug( "����˷�������������ֹ���ӱ������豸�Ͽ�\r\n" );
		// app����Ϊ����
	}

	protected function onPacket202( $msg )
	{
		// $this->outputDebug( "ҵ����Ϣ��\r\n" );
		// app����Ϊ��ȡ��ҵ����Ϣ�������ݣ�����ҵ���߼�����
		$this->doBizMessage( $msg );
	}

	protected function onPacket203( $msg )
	{
		// $this->outputDebug( "������ڷ���ҵ����Ϣ��ʱ��һ�η���ʧ�ܵ�ʱ��\r\n" );
		// app����Ϊ��begin��ʾ�����ʧ�ܵ�ʱ�䣬end��ʾ�µ����ӱ����յĵ�ǰʱ�䣬app��Ҫ�����ʱ���ڶ�ʧ����Ϣ��ͨ������api��ȡ��
		$begin = intval( $msg['begin'] / 1000 );
		$end = intval( $msg['end'] / 1000 );
		$this->doRecoverMessage( $begin, $end );
	}

	protected function onPacket101( $msg )
	{
		// $this->outputDebug( "���ӵ������ʱ��\r\n" );
		// app����Ϊ���ͻ�����������
		return true; // �ر����Ӳ��˳�
	}

	protected function onPacket102( $msg )
	{
		// $this->outputDebug( "�����������\r\n" );
		// app����Ϊ��msg��ʾ��������������Ҫ��ʱ�䣬��λ��s��app�����ʱ��֮���������ӷ���ˣ�����ʹ������api�����ʱ���ڶ�ʧ����Ϣ��ȡ��
		return true; // �ر����Ӳ��˳�
	}

	protected function onPacket103( $msg )
	{
		// $this->outputDebug( "����ĳЩԭ�����˳�����һЩ���⣬��Ҫ�Ͽ��ͻ���\r\n" );
		// app����Ϊ��msg��ʾ����app�ڶ���s֮�����µ��������ӣ�app����ѡ�����Ϸ����µ���������Ҳ����ѡ����һ��ʱ�������������
		return true; // �ر����Ӳ��˳�
	}

	protected function onPacket104( $msg )
	{
		// $this->outputDebug( "���ڿͻ��˷������ظ����������󣬷���˻��ǰһ�����������Ͽ�\r\n" );
		// app����Ϊ�����µ������Ͻ�����Ϣ�����Ұ�ǰһ��������ʣ�����Ϣ������
	}

	protected function onPacket105( $msg )
	{
		// $this->outputDebug( "������д�������Ϣ��ѹ\r\n" );
		// app����Ϊ��app����Ҫ���һ�����绷�������߽�����Ϣ�ʹ�����Ϣ���߳�û�зֿ�
	}

	/**
	 * ����ҵ����Ϣ
	 * @param array $msg - ҵ����Ϣ��
	 */
	protected function doBizMessage( $msg )
	{
		// ��Ҫ����չ����ʵ����Ӧ�Ĵ����߼�
	}

	/**
	 * ͨ������ API ������ȡ��ʧ��ҵ����Ϣ
	 * @param int $begin - ʱ������
	 * @param int $end - ʱ����յ�
	 */
	protected function doRecoverMessage( $begin, $end )
	{
		// ��Ҫ����չ����ʵ����Ӧ�Ĵ����߼�
	}
}

/**
 * RealtimeNotifySimple ��һ��ʹ�� RealtimeNotifyBase �ļ�ʾ����
 * 
 * �� RealtimeNotifyBase �Ļ����ϣ�RealtimeNotifySimple ֻ�Ǽ򵥵�������ҵ����Ϣ�����߼�����
 * û�аѴ�����̷ֵ�������߳���ȥ����ִ�С���Ԥ��ҵ����Ϣ�����Ƚ�ϡ�٣�������̺�ʱ����̫
 * ��������£������÷��Ƚϼ���Ч��
 */
class RealtimeNotifySimple extends RealtimeNotifyBase
{
	public function __construct()
	{
		parent::__construct();
	}

	protected function doBizMessage( $msg )
	{
		$this->outputDebug( "RealtimeNotifySimple::doBizMessage()\r\n" );

		// �����ﴦ��ҵ����Ϣ
		$this->outputDebug( var_export($msg,true) . "\r\n" );
	}

	protected function doRecoverMessage( $begin, $end )
	{
		$this->outputDebug( "RealtimeNotifySimple::doRecoverMessage()\r\n" );

		// ������ͨ������ API ��ȡָ��ʱ��ε�ҵ����Ϣ
		$begin = date( 'Y-m-d H:i:s', $begin );
		$end = date( 'Y-m-d H:i:s', $end );
		$this->outputDebug( "    begin[{$begin}] end[{$end}]\r\n" );
	}
}

/**
 * RealtimeNotifyForward �ǻ��� RealtimeNotifyBase ʵ�ֵ�ҵ�����ݰ�ת������
 * 
 * RealtimeNotifyForward ���յ�ҵ�����ת����ָ���� url �ϣ����Ҳ��ȴ����ؽ����
 * �����÷����������൱���ǰѴӳ����ӷ�ʽ�յ���ҵ����Ϣת��Ϊ�ص���ַ��֪ͨ��ʽ��
 * 
 * ���ǵ���ʵ�ʵĲ��𻷾��У�����ת����Ϣ�Ļص���ַ����������������ͬһ�������ϣ�����
 * ��ת����ʱ��û����֤�Ƿ���ɹ���Ҳû��ʧ�����ԣ�ֻҪ���ͳɹ����ɡ�
 * ������ͱ���ʧ�ܣ������Ϣ���ݰ��浵���顣
 */
class RealtimeNotifyForward extends RealtimeNotifyBase
{
	public function __construct()
	{
		parent::__construct();
		$this->setConfig( 'forward_host', 'localhost' );
		$this->setConfig( 'forward_port', 80 );
		$this->setConfig( 'forward_path', '/notify' );
	}

	/**
	 * �����ݰ�ת����ָ������ַ��
	 * ���ת��ʧ�ܣ��򱾵ر��汸�顣
	 * @param string $name
	 * @param mixed $value
	 */
	protected function forward( $name, $value )
	{
		$bSucc = false;
		$fp = @fsockopen( $this->config['forward_host'], $this->config['forward_port'], $errno, $errstr, 2 );
		if ( $fp ) {
			stream_set_timeout( $fp, 10 );

			$content = "{$name}=" . urlencode( json_encode( $value ) );
			$contentLength = strlen($content);
		
			$out = "POST {$this->config['forward_path']} HTTP/1.1\r\n";
			$out .= "Host: {$this->config['forward_host']}\r\n";
			$out .= "Content-Type: application/x-www-form-urlencoded\r\n";
			$out .= "Content-Length: {$contentLength}\r\n";
			if ( is_array($this->config['forward_headers']) ) {
				foreach ( $this->config['forward_headers'] as $header ) {
					$out .= "{$header}\r\n";
				}
			} else if ( is_string($this->config['forward_headers']) ) {
				$out .= "{$this->config['forward_headers']}\r\n";
			}
			$out .= "Connection: close\r\n\r\n";
			$out .= $content;

			$bSucc = strlen( $out ) == fwrite( $fp, $out );

			$this->outputDebug( $out . "\r\n" );

			fclose($fp);
		}

		if ( ! $bSucc ) {
			$this->onForwardFail( $name, $value );
		}
	}

	/**
	 * ת��ʧ��ʱ�����ݰ����浽Ӳ�̡�
	 */
	protected function onForwardFail( $name, $value )
	{
		// ������浵�ļ���ȫ·��
		$filename = $this->config['writable_dir'] . date('/Y-m/d/') . $name . date('_Ymd_His') . '.log';

		// ȷ���ļ��д��ڲ���д
		if ( !file_exists($filename) ) {
			$savedir = dirname($filename);
			if ( !file_exists($savedir) ) {
				mkdir( $savedir, 0774, true );
			}
			if ( !is_dir($savedir) || !is_writable($savedir) ) {
				return;
			}
		}

		// д���ļ�����
		file_put_contents( $filename, json_encode( $value ), FILE_APPEND );
	}

	protected function doBizMessage( $msg )
	{
		$this->forward( 'msg', $msg );
	}

	protected function doRecoverMessage( $begin, $end )
	{
		$this->forward( 'recover', array( 'begin' => $begin, 'end' => $end ) );
	}
}
