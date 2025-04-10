const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const Customer = require('../../models/customer.model');
const Package = require('../../models/package.model');
const { manageBandwidth } = require('../../services/network.service');

/**
 * Import customers from CSV file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<{success: boolean, message: string, imported: number, errors: Array}>}
 */
async function importCustomersFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let imported = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            try {
              // Validate required fields
              if (!row.name || !row.email || !row.phone || !row.address || 
                  !row.pppoeUsername || !row.pppoePassword || !row.packageId || 
                  !row.installationDate || !row.billingDay) {
                errors.push({
                  row: row,
                  error: 'Missing required fields'
                });
                continue;
              }
              
              // Check if package exists
              const package = await Package.findByPk(row.packageId);
              if (!package) {
                errors.push({
                  row: row,
                  error: `Package with ID ${row.packageId} not found`
                });
                continue;
              }
              
              // Check if customer with email or pppoeUsername already exists
              const existingCustomer = await Customer.findOne({
                where: {
                  [Op.or]: [
                    { email: row.email },
                    { pppoeUsername: row.pppoeUsername }
                  ]
                }
              });
              
              if (existingCustomer) {
                errors.push({
                  row: row,
                  error: `Customer with email ${row.email} or PPPoE username ${row.pppoeUsername} already exists`
                });
                continue;
              }
              
              // Create customer
              const newCustomer = await Customer.create({
                name: row.name,
                email: row.email,
                phone: row.phone,
                address: row.address,
                pppoeUsername: row.pppoeUsername,
                pppoePassword: row.pppoePassword,
                packageId: row.packageId,
                installationDate: new Date(row.installationDate),
                billingDay: parseInt(row.billingDay),
                locationLat: row.locationLat || null,
                locationLng: row.locationLng || null,
                notes: row.notes || null,
                status: row.status || 'active'
              });
              
              // Set bandwidth limits in Mikrotik
              await manageBandwidth(row.pppoeUsername, package.uploadSpeed, package.downloadSpeed);
              
              imported++;
            } catch (error) {
              errors.push({
                row: row,
                error: error.message
              });
            }
          }
          
          resolve({
            success: true,
            message: `Imported ${imported} customers with ${errors.length} errors`,
            imported,
            errors
          });
        } catch (error) {
          reject({
            success: false,
            message: error.message,
            imported,
            errors
          });
        }
      });
  });
}

/**
 * Import customers from Excel file
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<{success: boolean, message: string, imported: number, errors: Array}>}
 */
async function importCustomersFromExcel(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    const errors = [];
    let imported = 0;
    
    for (const row of data) {
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.phone || !row.address || 
            !row.pppoeUsername || !row.pppoePassword || !row.packageId || 
            !row.installationDate || !row.billingDay) {
          errors.push({
            row: row,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Check if package exists
        const package = await Package.findByPk(row.packageId);
        if (!package) {
          errors.push({
            row: row,
            error: `Package with ID ${row.packageId} not found`
          });
          continue;
        }
        
        // Check if customer with email or pppoeUsername already exists
        const existingCustomer = await Customer.findOne({
          where: {
            [Op.or]: [
              { email: row.email },
              { pppoeUsername: row.pppoeUsername }
            ]
          }
        });
        
        if (existingCustomer) {
          errors.push({
            row: row,
            error: `Customer with email ${row.email} or PPPoE username ${row.pppoeUsername} already exists`
          });
          continue;
        }
        
        // Create customer
        const newCustomer = await Customer.create({
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          pppoeUsername: row.pppoeUsername,
          pppoePassword: row.pppoePassword,
          packageId: row.packageId,
          installationDate: new Date(row.installationDate),
          billingDay: parseInt(row.billingDay),
          locationLat: row.locationLat || null,
          locationLng: row.locationLng || null,
          notes: row.notes || null,
          status: row.status || 'active'
        });
        
        // Set bandwidth limits in Mikrotik
        await manageBandwidth(row.pppoeUsername, package.uploadSpeed, package.downloadSpeed);
        
        imported++;
      } catch (error) {
        errors.push({
          row: row,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      message: `Imported ${imported} customers with ${errors.length} errors`,
      imported,
      errors
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      imported: 0,
      errors: []
    };
  }
}

module.exports = {
  importCustomersFromCSV,
  importCustomersFromExcel
};