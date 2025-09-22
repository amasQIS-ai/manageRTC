import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/";

const client = new MongoClient(uri);
let isConnected = false;

export const connectDB = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log("Connected to MongoDB -> Done");
    } catch (error) {
      console.error("Database Connection Error ->", error);
      throw error;
    }
  }
};

export const getTenantCollections = (tenantDbName) => {
  if (!isConnected) {
    throw new Error(
      "MongoDB client not connected yet. Call connectDB() first."
    );
  }
  const db = client.db(tenantDbName);
  return {
    // Existing collections
    stats: db.collection("stats"),
    companies: db.collection("companies"),
    details: db.collection("details"),     // for company details
    contacts: db.collection("contacts"),
    details: db.collection("details"),     // for contact details
    leads: db.collection("leads"),

    // Admin dashboard collections
    employees: db.collection("employees"),
    projects: db.collection("projects"),
    clients: db.collection("clients"),
    tasks: db.collection("tasks"),
    attendance: db.collection("attendance"),
    departments: db.collection("departments"),
    leaves: db.collection("leaves"),
    leaveRequests: db.collection("leaves"),
    leaveTypes: db.collection("leaveTypes"),
    approvals: db.collection("approvals"),
    invoices: db.collection("invoices"),
    deals: db.collection("deals"),
    activities: db.collection("activities"),
    todos: db.collection("todos"),
    schedules: db.collection("schedules"),
    birthdays: db.collection("birthdays"),
    jobs: db.collection("jobApplications"),
    earnings: db.collection("earnings"),

    
    // employee dashboard collection 
    skills: db.collection("skills"),
    salaryHistory: db.collection("salaryHistory"),
    meetings: db.collection("meetings"),
    notifications: db.collection('notifications'),


    //Pipeline Collections
    pipelines: db.collection("pipelines"),
    stages: db.collection("stages"),
    
    //Chat Collections
    conversations: db.collection("conversations"),
    messages: db.collection("messages"),
    
    //Social Feed
    socialFeeds: db.collection("socialFeeds"),
    follows: db.collection("follows"),
    hashtags: db.collection("hashtags"),

       // hr employee section collection
    hr: db.collection("hr"),   
    permissions:  db.collection("permissions"),
    policy: db.collection("policy"),
    designations: db.collection("designations"),
    assets: db.collection("assets"),
    // invoice section
    addInvoices: db.collection("invoices"),

    termination: db.collection("termination"),
    resignation: db.collection("resignation"),

    // notes - application
    notes: db.collection("notes"),
    candidates: db.collection("candidates")
  };
};

export const getsuperadminCollections = () => {
  if (!isConnected) {
    throw new Error(
      "MongoDB client not connected yet. Call connectDB() first."
    );
  }
  const db = client.db("AmasQIS");
  return {
    stats: db.collection("stats"),
    companiesCollection: db.collection("companies"),
    contacts: db.collection("contacts"),
    packagesCollection: db.collection("packages"),
    subscriptionsCollection: db.collection("subscriptions"),
    trainingtypes: db.collection("trainingtypes"),
    trainers: db.collection("trainers"),
    trainings: db.collection("trainings"),
  };
};