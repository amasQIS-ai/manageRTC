import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Create new client
export const createCandidate = async (companyId, candidateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] createCandidate", { companyId, candidateData });

    const newCandidate = {
      ...candidateData,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: candidateData.status || "Active",
      isDeleted: false,
      contractValue: candidateData.contractValue || 0,
      projects: candidateData.projects || 0,
    };

    const result = await collections.candidates.insertOne(newCandidate);
    console.log("[CandidateService] insertOne result", { result });

    if (result.insertedId) {
      const inserted = await collections.candidates.findOne({
        _id: result.insertedId,
      });
      console.log("[CandidateService] inserted candidate", { inserted });
      return { done: true, data: inserted };
    } else {
      console.error("[CandidateService] Failed to insert candidate");
      return { done: false, error: "Failed to insert candidate" };
    }
  } catch (error) {
    console.error("[CandidateService] Error in createCandidate", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Get all clients with filters
export const getCandidates = async (companyId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] getCandidates", { companyId, filters });

    const query = { companyId, isDeleted: { $ne: true } };

    // Apply filters
    if (filters.status && filters.status !== "All") {
      query.status = filters.status;
    }

    // Search filter
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { company: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (filters.sortBy) {
      sort = { [filters.sortBy]: filters.sortOrder === "asc" ? 1 : -1 };
    }

    console.log("[CandidateService] Final query", { query, sort });
    const candidates = await collections.candidates.find(query).sort(sort).toArray();
    console.log("[CandidateService] found candidates", { count: candidates.length });

    // Ensure dates are properly converted to Date objects
    const processedCandidates = candidates.map((candidate) => ({
      ...client,
      createdAt: candidate.createdAt ? new Date(candidate.createdAt) : null,
      updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt) : null,
    }));

    return { done: true, data: processedCandidates };
  } catch (error) {
    console.error("[CandidateService] Error in getCandidates", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Get single client by ID
export const getCandidateById = async (companyId, candidateId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] getCandidateById", { companyId, candidateId });

    if (!ObjectId.isValid(candidateId)) {
      return { done: false, error: "Invalid client ID format" };
    }

    const candidate = await collections.candidates.findOne({
      _id: new ObjectId(candidateId),
      companyId,
      isDeleted: { $ne: true },
    });

    if (!candidate) {
      return { done: false, error: "Candidate not found" };
    }

    // Ensure dates are properly converted
    const processedCandidate = {
      ...candidate,
      createdAt: candidate.createdAt ? new Date(candidate.createdAt) : null,
      updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt) : null,
    };

    return { done: true, data: processedCandidate };
  } catch (error) {
    console.error("[CandidateService] Error in getCandidateById", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Update client
export const updateCandidate = async (companyId, candidateId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] updateCandidate", {
      companyId,
      candidateId,
      updateData,
    });

    if (!ObjectId.isValid(candidateId)) {
      return { done: false, error: "Invalid client ID format" };
    }

    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Remove _id from update data to prevent conflicts
    delete updateFields._id;

    const result = await collections.candidates.updateOne(
      { _id: new ObjectId(candidateId), companyId, isDeleted: { $ne: true } },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: "Candidate not found" };
    }

    if (result.modifiedCount === 0) {
      return { done: false, error: "No changes made to candidate" };
    }

    // Return updated client
    const updatedCandidate = await collections.candidates.findOne({
      _id: new ObjectId(candidateId),
      companyId,
    });

    const processedCandidate = {
      ...updatedCandidate,
      createdAt: updatedCandidate.createdAt
        ? new Date(updatedCandidate.createdAt)
        : null,
      updatedAt: updatedCandidate.updatedAt
        ? new Date(updatedCandidate.updatedAt)
        : null,
    };

    return { done: true, data: processedCandidate };
  } catch (error) {
    console.error("[CandidateService] Error in updateCandidate", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Delete client (soft delete)
export const deleteCandidate = async (companyId, candidateId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] deleteCandidate", { companyId, candidateId });

    if (!ObjectId.isValid(candidateId)) {
      return { done: false, error: "Invalid client ID format" };
    }

    const result = await collections.candidates.updateOne(
      { _id: new ObjectId(candidateId), companyId, isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: "Candidate not found" };
    }

    return { done: true, data: { _id: candidateId, deleted: true } };
  } catch (error) {
    console.error("[CandidateService] Error in deleteCandidate", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Get client statistics
export const getCandidateStats = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] getCandidateStats", { companyId });

    const totalCandidates = await collections.candidates.countDocuments({
      companyId,
      isDeleted: { $ne: true },
    });

    const activeCandidates = await collections.candidates.countDocuments({
      companyId,
      isDeleted: { $ne: true },
      status: "Active",
    });

    const inactiveCandidates = await collections.candidates.countDocuments({
      companyId,
      isDeleted: { $ne: true },
      status: "Inactive",
    });

    // New clients in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCandidates = await collections.candidates.countDocuments({
      companyId,
      isDeleted: { $ne: true },
      createdAt: { $gte: thirtyDaysAgo },
    });

    const stats = {
      totalCandidates,
      activeCandidates,
      inactiveCandidates,
      newCandidates,
    };

    console.log("[CandidateService] Candidate stats", stats);
    return { done: true, data: stats };
  } catch (error) {
    console.error("[CandidateService] Error in getCandidateStats", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Export clients as PDF
export const exportCandidatesPDF = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] exportCandidatesPDF", { companyId });

    const candidates = await collections.candidates
      .find({
        companyId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const doc = new PDFDocument();
    const fileName = `candidates_${companyId}_${Date.now()}.pdf`;
    const tempDir = path.join(process.cwd(), "temp");
    const filePath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text("Candidate Report", 50, 50);
    doc.fontSize(12).text(`Generated on: ${format(new Date(), "PPP")}`, 50, 80);
    doc.text(`Total Candidates: ${candidates.length}`, 50, 100);

    let yPosition = 130;

    // Table header
    doc.fontSize(10).text("Name", 50, yPosition);
    doc.text("Company", 200, yPosition);
    doc.text("Email", 350, yPosition);
    doc.text("Status", 500, yPosition);
    doc.text("Created", 580, yPosition);

    yPosition += 20;

    // Draw line under header
    doc.moveTo(50, yPosition).lineTo(650, yPosition).stroke();

    yPosition += 10;

    // Client data
    candidates.forEach((candidate, index) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(candidate.name || "N/A", 50, yPosition);
      doc.text(candidate.company || "N/A", 200, yPosition);
      doc.text(candidate.email || "N/A", 350, yPosition);
      doc.text(candidate.status || "N/A", 500, yPosition);
      doc.text(
        format(new Date(candidate.createdAt), "MMM dd, yyyy"),
        580,
        yPosition
      );

      yPosition += 20;
    });

    doc.end();

    console.log("PDF generation completed successfully");
    const frontendurl = process.env.FRONTEND_URL + `/temp/${fileName}`;

    return {
      done: true,
      data: {
        pdfPath: filePath,
        pdfUrl: frontendurl,
      },
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { done: false, error: error.message };
  }
};

// Export clients as Excel
export const exportCandidatesExcel = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[CandidateService] exportCandidatesExcel", { companyId });

    const candidates = await collections.candidates
      .find({
        companyId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Candidates");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Address", key: "address", width: 40 },
      { header: "Status", key: "status", width: 10 },
      { header: "Contract Value", key: "contractValue", width: 15 },
      { header: "Projects", key: "projects", width: 10 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add data
    candidates.forEach((candidate) => {
      worksheet.addRow({
        name: candidate.name || "",
        company: candidate.company || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        address: candidate.address || "",
        status: candidate.status || "",
        contractValue: candidate.contractValue || 0,
        projects: candidate.projects || 0,
        createdAt: candidate.createdAt
          ? format(new Date(candidate.createdAt), "MMM dd, yyyy")
          : "",
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const fileName = `candidates_${companyId}_${Date.now()}.xlsx`;
    const tempDir = path.join(process.cwd(), "temp");
    const filePath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    console.log("Excel generation completed successfully");
    const frontendurl = process.env.FRONTEND_URL + `/temp/${fileName}`;

    return {
      done: true,
      data: {
        excelPath: filePath,
        excelUrl: frontendurl,
      },
    };
  } catch (error) {
    console.error("Error generating Excel:", error);
    return { done: false, error: error.message };
  }
};
