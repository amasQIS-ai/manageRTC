import * as candidateService from "../../services/candidates/candidates.services.js";

const candidateController = (socket, io) => {
    // Helper to validate company access (pattern from admin.controller.js)
    const validateCompanyAccess = (socket) => {
      if (!socket.companyId) {
        console.error("[Candidate] Company ID not found in user metadata", { user: socket.user?.sub });
        throw new Error("Company ID not found in user metadata");
      }
      const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
      if (!companyIdRegex.test(socket.companyId)) {
        console.error(`[Candidate] Invalid company ID format: ${socket.companyId}`);
        throw new Error("Invalid company ID format");
      }
      if (socket.userMetadata?.companyId !== socket.companyId) {
        console.error(`[Candidate] Company ID mismatch: user metadata has ${socket.userMetadata?.companyId}, socket has ${socket.companyId}`);
        throw new Error("Unauthorized: Company ID mismatch");
      }
      return socket.companyId;
    };
  
    // Allow admin and HR roles
    const isAuthorized = socket.userMetadata?.role === "admin" || socket.userMetadata?.role === "hr";
}  