/**
 * Bandwidth Manager Service
 * Provides integration with Mikrotik for bandwidth management and QoS
 */

// Try to require mikrotik-node, but handle the case when it's not available
let MikroNode;
try {
  MikroNode = require('mikrotik-node').MikroNode;
} catch (error) {
  console.warn('mikrotik-node module not found, using dummy implementation');
  // Dummy MikroNode implementation
  MikroNode = function(host, port, user, password) {
    this.connect = async () => console.log('Dummy connection established');
    this.openChannel = () => ({
      write: async () => console.log('Dummy write operation'),
      read: async () => []
    });
    this.close = () => console.log('Dummy connection closed');
    return this;
  };
}

const Customer = require('../models/customer.model');
const Package = require('../models/package.model');

// Initialize Mikrotik connection
const initMikrotikConnection = () => {
  const connection = new MikroNode(
    process.env.MIKROTIK_HOST,
    process.env.MIKROTIK_PORT,
    process.env.MIKROTIK_USER,
    process.env.MIKROTIK_PASSWORD
  );
  
  return connection;
};

/**
 * Apply bandwidth limit for a customer based on their package
 * @param {string} pppoeUsername - The PPPoE username of the customer
 * @param {number} downloadLimit - Download speed limit in Mbps
 * @param {number} uploadLimit - Upload speed limit in Mbps
 */
const applyBandwidthLimit = async (pppoeUsername, downloadLimit, uploadLimit) => {
  try {
    const connection = initMikrotikConnection();
    await connection.connect();
    
    const chan = connection.openChannel();
    
    // Convert Mbps to kbps for Mikrotik
    const downloadLimitKbps = downloadLimit * 1024;
    const uploadLimitKbps = uploadLimit * 1024;
    
    // Check if the PPPoE user exists
    await chan.write('/ppp/secret/print', [
      '?name=' + pppoeUsername
    ]);
    
    const secretResponse = await chan.read();
    
    if (secretResponse.length === 0) {
      connection.close();
      return {
        success: false,
        message: `PPPoE user ${pppoeUsername} not found`,
        timestamp: new Date()
      };
    }
    
    // Update the rate limit for the PPPoE user
    await chan.write('/ppp/secret/set', [
      '=.id=' + secretResponse[0]['.id'],
      '=rate-limit=' + `${uploadLimitKbps}k/${downloadLimitKbps}k`
    ]);
    
    await chan.read();
    
    // If the user is currently connected, update the active connection as well
    await chan.write('/ppp/active/print', [
      '?name=' + pppoeUsername
    ]);
    
    const activeResponse = await chan.read();
    
    if (activeResponse.length > 0) {
      await chan.write('/ppp/active/set', [
        '=.id=' + activeResponse[0]['.id'],
        '=rate-limit=' + `${uploadLimitKbps}k/${downloadLimitKbps}k`
      ]);
      
      await chan.read();
    }
    
    connection.close();
    
    return {
      success: true,
      message: `Bandwidth limit updated for ${pppoeUsername}: ${uploadLimit}Mbps/${downloadLimit}Mbps`,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error applying bandwidth limit:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Apply QoS settings for a customer
 * @param {string} pppoeUsername - The PPPoE username of the customer
 * @param {string} qosProfile - The QoS profile to apply
 */
const applyQoSProfile = async (pppoeUsername, qosProfile) => {
  try {
    const connection = initMikrotikConnection();
    await connection.connect();
    
    const chan = connection.openChannel();
    
    // Check if the QoS profile exists
    await chan.write('/queue/type/print', [
      '?name=' + qosProfile
    ]);
    
    const profileResponse = await chan.read();
    
    if (profileResponse.length === 0) {
      connection.close();
      return {
        success: false,
        message: `QoS profile ${qosProfile} not found`,
        timestamp: new Date()
      };
    }
    
    // Check if a queue already exists for this user
    await chan.write('/queue/simple/print', [
      '?name=' + pppoeUsername
    ]);
    
    const queueResponse = await chan.read();
    
    if (queueResponse.length > 0) {
      // Update existing queue
      await chan.write('/queue/simple/set', [
        '=.id=' + queueResponse[0]['.id'],
        '=queue=' + qosProfile,
        '=priority=5'
      ]);
    } else {
      // Create new queue
      await chan.write('/queue/simple/add', [
        '=name=' + pppoeUsername,
        '=target=' + pppoeUsername,
        '=queue=' + qosProfile,
        '=priority=5'
      ]);
    }
    
    await chan.read();
    connection.close();
    
    return {
      success: true,
      message: `QoS profile ${qosProfile} applied to ${pppoeUsername}`,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error applying QoS profile:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Sync all customer bandwidth limits with their packages
 */
const syncAllCustomerBandwidthLimits = async () => {
  try {
    // Get all active customers with their packages
    const customers = await Customer.findAll({
      where: { status: 'active' },
      include: [{ model: Package }]
    });
    
    console.log(`Syncing bandwidth limits for ${customers.length} customers`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const customer of customers) {
      try {
        if (!customer.Package) {
          console.log(`Customer ${customer.name} has no package assigned, skipping`);
          results.skipped++;
          continue;
        }
        
        const downloadSpeed = customer.Package.downloadSpeed;
        const uploadSpeed = customer.Package.uploadSpeed;
        
        // Apply bandwidth limit
        const result = await applyBandwidthLimit(
          customer.pppoeUsername,
          downloadSpeed,
          uploadSpeed
        );
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
        
      } catch (error) {
        console.error(`Error syncing bandwidth for customer ${customer.name}:`, error);
        results.failed++;
      }
    }
    
    console.log('Bandwidth sync completed:', results);
    return results;
    
  } catch (error) {
    console.error('Error in bandwidth sync process:', error);
    throw error;
  }
};

/**
 * Temporarily boost bandwidth for a customer
 * @param {string} pppoeUsername - The PPPoE username of the customer
 * @param {number} downloadBoost - Download speed boost in Mbps
 * @param {number} uploadBoost - Upload speed boost in Mbps
 * @param {number} durationMinutes - Duration of the boost in minutes
 */
const temporaryBandwidthBoost = async (pppoeUsername, downloadBoost, uploadBoost, durationMinutes) => {
  try {
    // Find customer and their package
    const customer = await Customer.findOne({
      where: { pppoeUsername },
      include: [{ model: Package }]
    });
    
    if (!customer) {
      return {
        success: false,
        message: `Customer with PPPoE username ${pppoeUsername} not found`,
        timestamp: new Date()
      };
    }
    
    if (!customer.Package) {
      return {
        success: false,
        message: `Customer ${customer.name} has no package assigned`,
        timestamp: new Date()
      };
    }
    
    // Calculate boosted speeds
    const boostedDownload = customer.Package.downloadSpeed + downloadBoost;
    const boostedUpload = customer.Package.uploadSpeed + uploadBoost;
    
    // Apply boosted bandwidth
    const result = await applyBandwidthLimit(
      pppoeUsername,
      boostedDownload,
      boostedUpload
    );
    
    if (!result.success) {
      return result;
    }
    
    // Schedule restoration of original bandwidth after duration
    setTimeout(async () => {
      try {
        await applyBandwidthLimit(
          pppoeUsername,
          customer.Package.downloadSpeed,
          customer.Package.uploadSpeed
        );
        
        console.log(`Restored original bandwidth for ${pppoeUsername} after boost period`);
      } catch (error) {
        console.error(`Error restoring original bandwidth for ${pppoeUsername}:`, error);
      }
    }, durationMinutes * 60 * 1000);
    
    return {
      success: true,
      message: `Bandwidth temporarily boosted for ${pppoeUsername} to ${boostedUpload}Mbps/${boostedDownload}Mbps for ${durationMinutes} minutes`,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error applying temporary bandwidth boost:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

module.exports = {
  applyBandwidthLimit,
  applyQoSProfile,
  syncAllCustomerBandwidthLimits,
  temporaryBandwidthBoost
};