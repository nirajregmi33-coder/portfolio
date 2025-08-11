---
title: "Connecting React with BigQuery using Node.js"
date: "2025-07-20"
slug: "react-bigquery-node"
---

This tutorial explains how to connect a React frontend with Google BigQuery using a Node.js backend.


```js
### Step 1: Setup Node.js Server


const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS)
});

const getUsers = async () => {
  console.log(process.env.BIGQUERY_DATASET)
  const query = SELECT * FROM \${process.env.BIGQUERY_DATASET}.user_master_list\ LIMIT 1000;
  const [rows] = await bigquery.query(query);
  return rows;
};

const addUser = async (user) => {
  const query = {
    query: INSERT INTO \${process.env.BIGQUERY_DATASET}.user_master_list\` 
            (user_code, username_kanji, username_kana) 
            VALUES (@code, @kanji, @kana)`,
    params: {
      code: user.code,
      kanji: user.usernameKanji,
      kana: user.usernameKana
    }
  };
  await bigquery.query(query);
};

module.exports = { getUsers, addUser };


### Step 2: Setup CRUD operation in server.js in the backend 

import dotenv from 'dotenv';  // Use import instead of require
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

// Load environment variables from .env file in the same directory as server.js
dotenv.config({ path: ${__dirname}/.env });
import express, { json } from 'express';
import cors from 'cors';
import { BigQuery } from '@google-cloud/bigquery';

const app = express();
app.use(cors());
app.use(json());

// BigQuery Client
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.get('/api/data', async (req, res) => {
  try {
    const query = "SELECT * FROM core-crowbar-266504.testMMP.test_user";
    const [rows] = await bigquery.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/data', async (req, res) => {
  try {
    // Debugging: Log the complete incoming request
    console.log('Incoming POST request headers:', req.headers);
    console.log('Raw request body:', req.body);

    // Handle both nested { user: {...} } and flat request structures
    const userData = req.body.user || req.body;
    
    // Validate required fields
    if (!userData.USER_CD && !userData.code) {
      throw new Error('User code is required');
    }

    // BigQuery INSERT query with parameterized values
    const query = `
      INSERT INTO \core-crowbar-266504.testMMP.test_user\
      (USER_CD, USER_LAST_NM, USERKN_LAST_NM, ADMIN_FLG)
      VALUES (@userCode, @userNameKanji, @userNameKana, @isManager)
    `;

    // Query parameters with fallbacks for different field naming conventions
    const options = {
      query: query,
      params: {
        userCode: userData.USER_CD || userData.code,
        userNameKanji: userData.USER_LAST_NM || userData.usernameKanji || '',
        userNameKana: userData.USERKN_LAST_NM || userData.usernameKana || '',
      //  organize: userData.STRUCTURE_CD || userData.organize || '',
      //  post: userData.POSITION_CD || userData.post || '',
        isManager: (userData.ADMIN_FLG || userData.isManager) ? 1 : 0
      },
      //location: 'US' // Specify dataset location if needed
    };

    

    console.log('Executing BigQuery with options:', options);

    // Execute the query
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();

    // Successful response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      insertedId: userData.USER_CD || userData.code,
      bigQueryResult: rows,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error processing POST request:', {
      error: err,
      stack: err.stack,
      requestBody: req.body
    });

    // Enhanced error response
    res.status(500).json({
      success: false,
      message: 'Failed to create user record',
      error: err.message,
      details: {
        bigQueryError: err.errors || null,
        receivedData: req.body,
        timestamp: new Date().toISOString()
      }
    });
  }
});
// PUT endpoint to update an existing user
app.put('/api/data/:userCode', async (req, res) => {
  try {
    // Get the userCode from the URL parameter
    const userCode = req.params.userCode;
    // Support both nested { user: {...} } and flat request structures
    const userData = req.body.user || req.body;
    
    if (!userCode) {
      throw new Error('User code is required for update');
    }
    
    // BigQuery UPDATE query with parameterized values
    const query = `
      UPDATE \core-crowbar-266504.testMMP.test_user\
      SET USER_LAST_NM = @userNameKanji,
          USERKN_LAST_NM = @userNameKana,
          ADMIN_FLG = @isManager
      WHERE USER_CD = @userCode
    `;
    
    const options = {
      query: query,
      params: {
        userCode: userCode,
        userNameKanji: userData.USER_LAST_NM || userData.usernameKanji || '',
        userNameKana: userData.USERKN_LAST_NM || userData.usernameKana || '',
        isManager: (userData.ADMIN_FLG || userData.isManager) ? 1 : 0
      }
    };

    console.log('Executing BigQuery update with options:', options);
    
    // Execute the update query
    const [job] = await bigquery.createQueryJob(options);
    await job.getQueryResults();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      updatedId: userCode,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error processing PUT request:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update user record',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});
// DELETE Route
app.delete('/api/data/:userId', async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameter
  try {
    // Define the DELETE query
    const query = `
      DELETE FROM \core-crowbar-266504.testMMP.test_user\
      WHERE USER_CD = @userId
    `;
    
    // Define query parameters
    const options = {
      query: query,
      params: {
        userId: userId,
      }
    };
    
    console.log('Executing DELETE query with options:', options);
    
    // Execute the query
    const [job] = await bigquery.createQueryJob(options);
    await job.getQueryResults();
    
    // Successful response
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error deleting user:', {
      error: err,
      stack: err.stack,
    });
    
    // Error response
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: err.message,
      details: {
        bigQueryError: err.errors || null,
        timestamp: new Date().toISOString()
      }
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});
---



