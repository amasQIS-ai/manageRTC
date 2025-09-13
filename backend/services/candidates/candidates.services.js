import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

// Create new candidate
export const createCandidate = async (companyId, candidateData) => {
  try {
    const collections = getTenantCollections(companyId);

  }catch(error){
     
  }
}