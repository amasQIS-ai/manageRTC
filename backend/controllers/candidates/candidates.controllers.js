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

  // CREATE client
  socket.on("candidate:create", async (data) => {
    try {
      console.log("[Candidate] candidate:create event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, data });
      if (!isAuthorized) throw new Error("Unauthorized: Admin or HR role required");
      const companyId = validateCompanyAccess(socket);
      
      // Validate required fields
      if (!data.name || !data.email || !data.candidate) {
        throw new Error("Name, email, and company are required");
      }
      
      // Always include companyId in the client data
      const result = await candidateService.createCandidate(companyId, { ...data, companyId });
      if (!result.done) {
        console.error("[Candidate] Failed to create candidate", { error: result.error });
      }
      socket.emit("candidate:create-response", result);
      
      // Broadcast to admin and HR rooms to update client lists
      io.to(`admin_room_${companyId}`).emit("candidate:candidate-created", result);
      io.to(`hr_room_${companyId}`).emit("candidate:candidate-created", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:create", { error: error.message });
      socket.emit("candidate:create-response", { done: false, error: error.message });
    }
  });

  // GET all clients
  socket.on("candidate:getAll", async (filters = {}) => {
    try {
      console.log("[Candidate] candidate:getAll event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, filters });
      const companyId = validateCompanyAccess(socket);
      const result = await candidateService.getCandidates(companyId, filters);
      if (!result.done) {
        console.error("[Candidate] Failed to get candidates", { error: result.error });
      }
      socket.emit("candidate:getAll-response", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:getAll", { error: error.message });
      socket.emit("candidate:getAll-response", { done: false, error: error.message });
    }
  });

  // GET single client by ID
  socket.on("candidate:getById", async (candidateId) => {
    try {
      console.log("[Candidate] candidate:getById event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, candidateId });
      const companyId = validateCompanyAccess(socket);
      const result = await candidateService.getCandidateById(companyId, candidateId);
      if (!result.done) {
        console.error("[Candidate] Failed to get candidate", { error: result.error });
      }
      socket.emit("candidate:getById-response", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:getById", { error: error.message });
      socket.emit("candidate:getById-response", { done: false, error: error.message });
    }
  });

  // UPDATE client
  socket.on("candidate:update", async (data) => {
    try {
      console.log("[Candidate] candidate:update event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, data });
      if (!isAuthorized) throw new Error("Unauthorized: Admin or HR role required");
      const companyId = validateCompanyAccess(socket);
      
      if (!data._id) {
        throw new Error("Candidate ID is required for update");
      }
      
      const result = await candidateService.updateCandidate(companyId, data._id, data);
      if (!result.done) {
        console.error("[Candidate] Failed to update candidate", { error: result.error });
      }
      socket.emit("candidate:update-response", result);
      
      // Broadcast to admin and HR rooms to update client lists
      io.to(`admin_room_${companyId}`).emit("candidate:candidate-updated", result);
      io.to(`hr_room_${companyId}`).emit("candidate:candidate-updated", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:update", { error: error.message });
      socket.emit("candidate:update-response", { done: false, error: error.message });
    }
  });

  // DELETE client
  socket.on("candidate:delete", async (candidateId) => {
    try {
      console.log("[Candidate] candidate:delete event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, candidateId });
      if (!isAuthorized) throw new Error("Unauthorized: Admin or HR role required");
      const companyId = validateCompanyAccess(socket);
      
      const result = await candidateService.deleteCandidate(companyId, candidateId);
      if (!result.done) {
        console.error("[Candidate] Failed to delete candidate", { error: result.error });
      }
      socket.emit("candidate:delete-response", result);
      
      // Broadcast to admin and HR rooms to update client lists
      io.to(`admin_room_${companyId}`).emit("candidate:candidate-deleted", result);
      io.to(`hr_room_${companyId}`).emit("candidate:candidate-deleted", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:delete", { error: error.message });
      socket.emit("candidate:delete-response", { done: false, error: error.message });
    }
  });

  // Get all client data at once (for dashboard)
  socket.on("candidate:getAllData", async (filters = {}) => {
    try {
      console.log("[Candidate] candidate:getAllData event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, filters });
      const companyId = validateCompanyAccess(socket);
      
      const [clients, stats] = await Promise.all([
        candidateService.getCandidates(companyId, filters),
        candidateService.getCandidateStats(companyId)
      ]);
      
      const response = {
        done: true,
        data: {
          candidates: candidates.data || [],
          stats: stats.data || {}
        }
      };
      
      socket.emit("candidate:getAllData-response", response);
    } catch (error) {
      console.error("[Candidate] Error in candidate:getAllData", { error: error.message });
      socket.emit("candidate:getAllData-response", { done: false, error: error.message });
    }
  });

  // Export clients as PDF
  socket.on("candidate:export-pdf", async () => {
    try {
      console.log("[Candidate] candidate:export-pdf event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId });
      const companyId = validateCompanyAccess(socket);
      const result = await candidateService.exportCandidatesPDF(companyId);
      socket.emit("candidate:export-pdf-response", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:export-pdf", { error: error.message });
      socket.emit("candidate:export-pdf-response", { done: false, error: error.message });
    }
  });

  // Export clients as Excel
  socket.on("candidate:export-excel", async () => {
    try {
      console.log("[Candidate] candidate:export-excel event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId });
      const companyId = validateCompanyAccess(socket);
      const result = await candidateService.exportCandidatesExcel(companyId);
      socket.emit("candidate:export-excel-response", result);
    } catch (error) {
      console.error("[Candidate] Error in candidate:export-excel", { error: error.message });
      socket.emit("candidate:export-excel-response", { done: false, error: error.message });
    }
  });
};

export default candidateController;