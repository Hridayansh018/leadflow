// All lead records are now stored as individual documents in the outreach.storage collection.
// Each document has a userId (ObjectId) and type: 'lead'.
// Example:
// {
//   _id: ObjectId(...),
//   userId: ObjectId(...),
//   type: 'lead',
//   name: 'Lead Name',
//   email: 'lead@example.com',
//   ...other lead fields
// } 