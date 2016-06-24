<?php
/**
 * @link      http://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license   http://craftcms.com/license
 */

namespace craft\app\cache;

/**
 * ZendDataCache implements a cache application module based on the Zend DataCache delivered with
 * [ZendServer](http://www.zend.com/en/products/server/).
 *
 * To use this application component, the Zend Data Cache PHP extension must be loaded.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since  3.0
 */
class ZendDataCache extends \yii\caching\ZendDataCache
{

}