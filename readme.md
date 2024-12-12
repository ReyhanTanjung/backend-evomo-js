# **Program Documentation**

This document provides comprehensive information about the backend configuration, API endpoints, and deployment instructions for the program. The application is designed to manage energy meter data, including retrieving historical readings, detecting anomalies, and managing real-time notifications.

The project consists of a backend service built using **Node.js** and **Express**, which interacts with a **PostgreSQL** database. The application also integrates **Firebase Cloud Messaging** for push notifications and utilizes machine learning models deployed on **Google Cloud Run**.

The documentation covers the following sections:
- Backend API documentation for managing energy meter data.
- Details on fetching readings and anomalies.
- Instructions for deploying the backend on **Google Cloud Platform (GCP)** and using **Cloud Run** for machine learning services.


# Table of Contents
- [Current Project Configuration](#current-project-configuration)
- [API Documentation](#api-documentation)
  - [1. Fetch Historical Data](#1-fetch-historical-data)
  - [2. Fetch Last Two Records](#2-fetch-last-two-records)
  - [3. Fetch Anomalies](#3-fetch-anomalies)
  - [4. Fetch Detailed Anomaly Information](#4-fetch-detailed-anomaly-information)
  - [5. Add Notification Token](#5-add-notification-token)
- [Backend Deployment on Google VM Instances](#backend-deployment-on-google-vm-instances)
- [ML Deployment on Google Cloud Run](#ml-deployment-on-google-cloud-run)
- [Database Configuration : Postgresql](#database-configuration-postgresql)

# **Current Project Configuration**

Here is some of current projects configuration:
```txt
Backend Address : http://35.225.180.19:3000
ML Prediction Model : https://ml-api-903524315911.asia-southeast2.run.app
Postgresql Server : 34.123.56.222
```

# **API Documentation**

This is an API service designed to manage and access energy meter data. It includes various endpoints for fetching historical data, anomalies, and handling notifications. This API is built with **Node.js** and **Express**, and integrates with **Firebase** for cloud messaging and **Postgresql** for data storage.

## 1. Fetch Historical Data

Fetch energy meter readings within a specific date range for a given location.

### Endpoint
`GET /api/fetch_data/:location/:startdate&:enddate`

### Parameters
- `location` (string): The location identifier (e.g., "location1").
- `startdate` (string): Start date for data retrieval in `YYYY-MM-DD%20HH:mm:ss` format.
- `enddate` (string): End date for data retrieval in `YYYY-MM-DD%20HH:mm:ss` format.

### Example Request
```http
GET /api/fetch_data/location1/2023-01-01%2012:00:00&2023-12-31%2018:00:00
```

### Example Response
```json
[
    {
        "id": "1",
        "reading_time": "2023-01-01 12:00:00",
        "position": "Position 1",
        "meter_type": "Type A",
        "meter_serial_number": "123456789",
        "active_energy_import": 100.5,
        "active_energy_export": 50.2,
        "reactive_energy_import": 20.5,
        "reactive_energy_export": 10.2,
        "apparent_energy_import": 120.0,
        "apparent_energy_export": 60.0
    }
    ...
        {
        "id": "20",
        "reading_time": "2023-01-01 18:00:00",
        "position": "Position 1",
        "meter_type": "Type A",
        "meter_serial_number": "123456789",
        "active_energy_import": 100.5,
        "active_energy_export": 50.2,
        "reactive_energy_import": 20.5,
        "reactive_energy_export": 10.2,
        "apparent_energy_import": 120.0,
        "apparent_energy_export": 60.0
    }
]
```

## 2. Fetch Last Two Records

Fetch the last two energy meter readings for a specific location.

### Endpoint
`GET /api/fetch_data/:location/last_history`

### Parameters
- `location` (string): The location identifier (e.g., "location1").

### Example Request
```http
GET /api/fetch_data/location1/last_history
```

### Example Response
```json
[
    {
        "id": "1",
        "reading_time": "2023-12-30 12:00:00",
        "position": "Position 1",
        "meter_type": "Type A",
        "meter_serial_number": "123456789",
        "active_energy_import": 100.5,
        "active_energy_export": 50.2,
        "reactive_energy_import": 20.5,
        "reactive_energy_export": 10.2,
        "apparent_energy_import": 120.0,
        "apparent_energy_export": 60.0
    },
    {
        "id": "2",
        "reading_time": "2023-12-29 12:00:00",
        "position": "Position 2",
        "meter_type": "Type B",
        "meter_serial_number": "987654321",
        "active_energy_import": 110.3,
        "active_energy_export": 55.1,
        "reactive_energy_import": 22.1,
        "reactive_energy_export": 11.0,
        "apparent_energy_import": 130.0,
        "apparent_energy_export": 65.5
    }
]
```

## 3. Fetch Anomalies

Fetch all recorded anomalies.

### Endpoint
`GET /api/fetch_data/anomaly`

### Parameters
- `None`

### Example Request
```http
GET /api/fetch_data/anomaly
```

### Example Response
```json
[
    {
        "id": "1",
        "position": "Position 1",
        "reading_time": "2023-12-25 12:00:00",
        "anomaly_type": "Overload"
    },
    {
        "id": "2",
        "position": "Position 2",
        "reading_time": "2023-12-26 12:00:00",
        "anomaly_type": "Underload"
    }
]
```

## 4. Fetch Detailed Anomaly Information

Fetch detailed information for a specific anomaly by ID.

### Endpoint
`GET /api/fetch_data/anomaly/:id`

### Parameters
- `id` (integer): Unique identifier for the anomaly.

### Example Request
```http
GET /api/fetch_data/anomaly/1
```

### Example Response
```json
[
    {
        "reading_time": "2023-12-25 12:00:00",
        "position": "Position 1",
        "meter_type": "Type A",
        "meter_serial_number": "123456789",
        "active_energy_import": 150.2,
        "active_energy_export": 75.1,
        "reactive_energy_import": 30.0,
        "reactive_energy_export": 15.5,
        "apparent_energy_import": 180.2,
        "apparent_energy_export": 90.1,
        "anomaly_type": "Overload",
        "predicted_energy": 160.0
    }
]
```

## 5. Add Notification Token

Register a notification token for sending push notifications.   

### Endpoint
`POST /api/add_notification_token`

### Parameters
- `token` (string): The notification token to register.

### Example Request
```http
POST /api/add_notification_token
Content-Type: application/json

{
  "token": "sample-notification-token"
}
```

### Example Response
```json
{
  "message": "Token berhasil disimpan"
}
```



# **Backend Deployment on Google VM Instances**

This section provides instructions on how to deploy the backend application to a Google Cloud Platform (GCP) Virtual Machine (VM). The backend application is built using Node.js and Express, and communicates with Firebase, Postgresql, and Cloud Run.

## Prerequisites

Before you start the deployment process, make sure you have the following:
- A **Google Cloud Platform (GCP)** account.
- **Google Cloud SDK** installed on your local machine or VM (if you are deploying from a VM).
- **GCP VM Instance** with sufficient resources (the lowest specification will do).
- **SSH access** to your VM instance.
- **Node.js and NPM** installed on the VM.
- Firebase project and **Firebase Admin SDK** credentials.

## Steps for Deployment

### 1. **Set Up Your GCP VM**
   - Create a **Virtual Machine instance** in the **Google Cloud Console**.
   - Allocate enough resources for your application (the lowest specification will do).
   - **Reserve external static IP address** to ensure your VM's IP address doesn't change.

### 2. **Connect to the VM Instance**
   - Use the following command to SSH into your VM from the terminal:
     ```bash
     gcloud compute ssh <YOUR-VM-NAME> --zone <YOUR-ZONE>
     ```
     Replace `<YOUR-VM-NAME>` with the name of your VM instance, and `<YOUR-ZONE>` with your GCP region zone.

### 3. **Install Dependencies**
   - Update your VM and install required packages:
     ```bash
     sudo apt update && sudo apt upgrade -y
     sudo apt install -y nodejs npm
     ```
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

### 4. **Clone Your Backend Application Repository**
   - If you haven't already, clone your backend project from your version control system (e.g., GitHub):
     ```bash
     git clone https://github.com/your-username/your-repository.git
     cd your-repository
     ```

### 5. **Install Application Dependencies**
   - Run the following command to install all the necessary dependencies:
     ```bash
     npm install
     ```

### 6. **Set Up Firebase Admin SDK**
   - Set up Firebase in your backend by adding the Firebase Admin SDK credentials.
   - Download the **Firebase service account key JSON file** from your Firebase project.
   - Set the variable in the program to point to this file.

### 7. **Set Environment Variables**
   - Ensure all required environment variables (such as database connection strings, Firebase credentials, mqtt access) are set in your environment.

### 8. **Start the Backend Application**
   - Run the backend application using the following command:
     ```bash
     npm start
     ```
     - If using a production environment, you might want to use a process manager like **PM2** to keep the application running:
       ```bash
       sudo npm install pm2 -g
       pm2 start app.js
       pm2 save
       ```

### 9. **Configure Firewall and Open Ports**
   - Ensure that the necessary ports are open in your GCP firewall settings:
     - Open the **Google Cloud Console** > **VPC Network** > **Firewall rules**.
     - Add a rule to allow inbound traffic on port `80` (HTTP) or `443` (HTTPS) depending on your configuration and on port `3000`.`

### 10. **Set Up a Reverse Proxy (Optional)**
   - If you want to use NGINX or Apache as a reverse proxy for your backend application:
     - Install **NGINX** on your VM:
       ```bash
       sudo apt install nginx
       ```
     - Configure NGINX to forward HTTP traffic to your backend app:
       Edit the `/etc/nginx/sites-available/default` file and add the following:
       ```
       server {
           listen 80;
           server_name <your-domain.com>;

           location / {
               proxy_pass http://localhost:3000;
               proxy_http_version 1.1;
               proxy_set_header Upgrade $http_upgrade;
               proxy_set_header Connection 'upgrade';
               proxy_set_header Host $host;
               proxy_cache_bypass $http_upgrade;
           }
       }
       ```
     - Restart NGINX:
       ```bash
       sudo systemctl restart nginx
       ```

# **ML Deployment on Google Cloud Run**

This section explains how to deploy your Machine Learning model on Google Cloud Run, pulling the code and model directly from GitHub without needing Docker or Cloud Storage.

## Prerequisites

Before you begin, make sure you have the following:

- **Google Cloud Platform (GCP)** account and project.
- **Google Cloud SDK** installed on your local machine or VM.
- **Google Cloud Run** API enabled for your project.
- **Google Cloud Storage (GCS)** bucket for storing your model file (`model.h5` or similar).
- **Python 3.8+** environment with necessary libraries.
- **Flask** application to serve the ML model.

## Steps for Deployment

### 1. **Set Up Google Cloud Project**
   - Ensure you have a **Google Cloud Platform project**. If not, create a new project:
     1. Go to the **Google Cloud Console**.
     2. Create a new project.
     3. Enable **Cloud Run** API and **Cloud Build** API in your project.

### 2. **Install and Initialize Google Cloud SDK**
   - If you don't have the **Google Cloud SDK** installed, download and install it from [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
   - Authenticate with your GCP account:
     ```bash
     gcloud auth login
     ```
   - Set your project:
     ```bash
     gcloud config set project <YOUR_PROJECT_ID>
     ```

### 3. **Prepare the Flask Application**

Create a Flask application to serve your ML model. Here's a basic template for your `app.py`:

#### app.py

```python
import os
import json
import joblib
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the model from Google Cloud Storage
def load_model():
    model_path = 'gs://<your-bucket-name>/model/model.h5'  # Change to your GCS path
    model = joblib.load(model_path)  # Or use keras.models.load_model() for Keras models
    return model

model = load_model()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the input data from the POST request
        data = request.get_json()
        features = data['features']  # Adjust this as per your model input

        # Make predictions
        prediction = model.predict([features])

        # Return prediction as JSON
        return jsonify({'prediction': prediction.tolist()})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

### 4. **Create `requirements.txt`**

Create a requirements.txt file that lists all the necessary Python dependencies for your Flask app, including the ML model library (e.g., scikit-learn, tensorflow, etc.):

```txt
Flask==2.0.2
joblib==1.0.1
scikit-learn==0.24.2
tensorflow==2.4.0
```

### 4. **Deploy the Application to Google Cloud Run**
1. Go to your Google Cloud Console > Cloud Run > Create Service.
2. Under Source, choose GitHub and connect your GitHub repository.
3. After linking your GitHub repository:
    - Choose the branch containing your app (main, master, etc.).
    - Set up any environment variables you need (optional).
    - Configure build options to install dependencies from requirements.txt.
4. Click on Deploy.

# **Database Configuration : Postgresql**

This section outlines how to configure Google Cloud SQL with PostgreSQL for use in your application deployed on Google Cloud Run.

## Prerequisites

Before proceeding, ensure you have the following:

- A **Google Cloud Platform (GCP)** account and a project.
- **Google Cloud SDK** installed on your local machine or VM.
- **Google Cloud SQL API** enabled for your project.
- A **PostgreSQL database** set up on **Google Cloud SQL**.

## Steps for Database Configuration

### 1. **Set Up Google Cloud SQL with PostgreSQL**
1. Go to the Google Cloud Console.
2. Navigate to SQL > Create Instance.
3. Choose PostgreSQL and click Next.
4. Fill in the instance configuration.
5. On configuration, make sure to allow your network address to access this database 
6. Click Create to create the Cloud SQL PostgreSQL instance.
7. Go to your SQL instance in the Cloud Console.
8. Under the Databases section, click Create Database and give it a name (e.g., my_database).

