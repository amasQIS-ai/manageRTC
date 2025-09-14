import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useJobs } from "../../../hooks/useJobs";
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import PredefinedDateRanges from "../../../core/common/datePicker";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { DatePicker } from "antd";
import CommonSelect from "../../../core/common/commonSelect";
import AddJob from "./add_job";
import EditJob from "./edit_job";
import DeleteJob from "./delete_job";
import { message } from "antd";

interface Job {
  _id: string;
  title: string;
  category: string;
  type: string;
  description?: string;
  requirements?: string;
  skills?: string[];
  tags?: string[];
  location: {
    country: string;
    state: string;
    city: string;
  };
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  numberOfPositions: number;
  status: 'Active' | 'Inactive';
  appliedCount?: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

const JobList = () => {
  const {
    jobs,
    stats,
    fetchAllData,
    fetchStats,
    loading,
    error,
    exportPDF,
    exportExcel,
    exporting,
  } = useJobs();

  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize data fetch
  useEffect(() => {
    console.log("JobList component mounted");
    fetchAllData();
    fetchStats();
  }, [fetchAllData, fetchStats]);

  // Apply filters whenever jobs or filter states change
  useEffect(() => {
    console.log("[JobList] Applying filters...");
    console.log("[JobList] Current filters:", {
      selectedStatus,
      selectedCategory,
      selectedType,
      selectedSort,
      searchQuery,
    });
    console.log("[JobList] Total jobs before filtering:", jobs.length);

    if (!jobs || jobs.length === 0) {
      setFilteredJobs([]);
      return;
    }

    let result = [...jobs];

    // Status filter
    if (selectedStatus && selectedStatus !== '') {
      console.log("[JobList] Filtering by status:", selectedStatus);
      result = result.filter((job) => job.status === selectedStatus);
      console.log("[JobList] After status filter:", result.length);
    }

    // Category filter
    if (selectedCategory && selectedCategory !== '') {
      console.log("[JobList] Filtering by category:", selectedCategory);
      result = result.filter((job) => job.category === selectedCategory);
      console.log("[JobList] After category filter:", result.length);
    }

    // Type filter
    if (selectedType && selectedType !== '') {
      console.log("[JobList] Filtering by type:", selectedType);
      result = result.filter((job) => job.type === selectedType);
      console.log("[JobList] After type filter:", result.length);
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      console.log("[JobList] Filtering by search query:", searchQuery);
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query) ||
          job.type.toLowerCase().includes(query) ||
          (job.description && job.description.toLowerCase().includes(query)) ||
          (job.skills && job.skills.some(skill => skill.toLowerCase().includes(query))) ||
          (job.location && job.location.city.toLowerCase().includes(query)) ||
          (job.location && job.location.state.toLowerCase().includes(query)) ||
          (job.location && job.location.country.toLowerCase().includes(query))
      );
      console.log("[JobList] After search filter:", result.length);
    }

    // Sort
    if (selectedSort) {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        switch (selectedSort) {
          case 'asc':
            return a.title.localeCompare(b.title);
          case 'desc':
            return b.title.localeCompare(a.title);
          case 'recent':
            return dateB.getTime() - dateA.getTime();
          case 'oldest':
            return dateA.getTime() - dateB.getTime();
          case 'salary':
            return (b.salaryRange?.min || 0) - (a.salaryRange?.min || 0);
          default:
            return 0;
        }
      });
    }

    console.log("[JobList] Final filtered jobs count:", result.length);
    setFilteredJobs(result);
  }, [jobs, selectedStatus, selectedCategory, selectedType, selectedSort, searchQuery]);

  // Handle filter changes
  const handleStatusChange = (status: string) => {
    console.log("[JobList] Status filter changed to:", status);
    setSelectedStatus(status);
  };

  const handleCategoryChange = (category: string) => {
    console.log("[JobList] Category filter changed to:", category);
    setSelectedCategory(category);
  };

  const handleTypeChange = (type: string) => {
    console.log("[JobList] Type filter changed to:", type);
    setSelectedType(type);
  };

  const handleSortChange = (sort: string) => {
    console.log("[JobList] Sort filter changed to:", sort);
    setSelectedSort(sort);
  };

  const handleSearchChange = (query: string) => {
    console.log("[JobList] Search query changed to:", query);
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    console.log("[JobList] Clearing all filters");
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedSort('');
    setSearchQuery('');
  };

  // Handle edit job
  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    // Dispatch custom event that edit_job.tsx is listening for
    window.dispatchEvent(
      new CustomEvent('edit-job', { detail: { job } })
    );
  };

  // Handle delete job
  const handleDeleteJob = (job: Job) => {
    setSelectedJob(job);
    // Dispatch custom event that delete_job.tsx is listening for
    window.dispatchEvent(
      new CustomEvent('delete-job', { detail: { job } })
    );
  };

  // Export functions
  const handleExportPDF = useCallback(() => {
    exportPDF();
  }, [exportPDF]);

  const handleExportExcel = useCallback(() => {
    exportExcel();
  }, [exportExcel]);

  // Table columns
  const columns = [
    {
      title: "Job ID",
      dataIndex: "_id",
      render: (text: string, record: Job) => (
        <Link to={all_routes.jobdetails.replace(':jobId', record._id)} className="link-default">
          {record._id.slice(-8).toUpperCase()}
        </Link>
      ),
      sorter: (a: Job, b: Job) => a._id.localeCompare(b._id),
    },
    {
      title: "Job Title",
      dataIndex: "title",
      render: (text: string, record: Job) => (
        <div className="d-flex align-items-center">
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to={all_routes.jobdetails.replace(':jobId', record._id)}>{record.title}</Link>
            </h6>
            <span className="fs-12 fw-normal text-gray">{record.category}</span>
          </div>
        </div>
      ),
      sorter: (a: Job, b: Job) => a.title.localeCompare(b.title),
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (text: string) => (
        <span className="badge badge-soft-info">{text}</span>
      ),
      sorter: (a: Job, b: Job) => a.type.localeCompare(b.type),
    },
    {
      title: "Applications",
      dataIndex: "appliedCount",
      render: (text: number) => <span>{text || 0} Applicants</span>,
      sorter: (a: Job, b: Job) => (a.appliedCount || 0) - (b.appliedCount || 0),
    },
    {
      title: "Location",
      dataIndex: "location",
      render: (location: { city: string; state: string; country: string }) => (
        <span>
          {location.city}, {location.state}, {location.country}
        </span>
      ),
      sorter: (a: Job, b: Job) => a.location.city.localeCompare(b.location.city),
    },
    {
      title: "Salary Range",
      dataIndex: "salaryRange",
      render: (salaryRange: { min: number; max: number; currency: string }) => (
        <span>
          {salaryRange.min.toLocaleString()} - {salaryRange.max.toLocaleString()} {salaryRange.currency} / month
        </span>
      ),
      sorter: (a: Job, b: Job) => (a.salaryRange?.min || 0) - (b.salaryRange?.min || 0),
    },
    {
      title: "Posted Date",
      dataIndex: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: Job, b: Job) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span
          className={`badge ${
            text === "Active" ? "badge-soft-success" : "badge-soft-warning"
          }`}
        >
          {text}
        </span>
      ),
      sorter: (a: Job, b: Job) => a.status.localeCompare(b.status),
    },
    {
      title: "",
      dataIndex: "actions",
      render: (text: any, record: Job) => (
        <div className="d-flex align-items-center">
          <div className="dropdown">
            <Link
              to="#"
              className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="ti ti-dots-vertical fs-14"></i>
            </Link>
            <ul className="dropdown-menu dropdown-menu-right p-3">
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#edit_job"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditJob(record);
                  }}
                >
                  <i className="ti ti-edit me-2"></i>Edit
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item rounded-1"
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#delete_job"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteJob(record);
                  }}
                >
                  <i className="ti ti-trash me-2"></i>Delete
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Jobs</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home"></i>
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Job List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.joblist}
                    className="btn btn-icon btn-sm active bg-primary text-white"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={all_routes.jobgrid}
                    className="btn btn-icon btn-sm"
                  >
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExportPDF();
                        }}
                      >
                        {exporting ? "Exporting..." : "Export as PDF"}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExportExcel();
                        }}
                      >
                        {exporting ? "Exporting..." : "Export as Excel"}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_job"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2"></i>
                  Add Job
                </Link>
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Jobs Stats */}
          <div className="row">
            <div className="col-xl-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="flex-grow-1">
                      <p className="text-gray fs-14 fw-medium mb-1">Total Jobs</p>
                      <h4 className="fw-bold">{stats?.totalJobs || 0}</h4>
                    </div>
                    <span className="avatar avatar-md bg-primary flex-shrink-0">
                      <i className="ti ti-briefcase fs-16"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="flex-grow-1">
                      <p className="text-gray fs-14 fw-medium mb-1">Active Jobs</p>
                      <h4 className="fw-bold">{stats?.activeJobs || 0}</h4>
                    </div>
                    <span className="avatar avatar-md bg-success flex-shrink-0">
                      <i className="ti ti-circle-check fs-16"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="flex-grow-1">
                      <p className="text-gray fs-14 fw-medium mb-1">Inactive Jobs</p>
                      <h4 className="fw-bold">{stats?.inactiveJobs || 0}</h4>
                    </div>
                    <span className="avatar avatar-md bg-warning flex-shrink-0">
                      <i className="ti ti-circle-x fs-16"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="flex-grow-1">
                      <p className="text-gray fs-14 fw-medium mb-1">New Jobs</p>
                      <h4 className="fw-bold">{stats?.newJobs || 0}</h4>
                    </div>
                    <span className="avatar avatar-md bg-info flex-shrink-0">
                      <i className="ti ti-plus fs-16"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Jobs Stats */}

          {/* Jobs List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Job List</h5>
            </div>
            <div className="card-body p-0">
              <div className="custom-datatable-filter">
                <div className="row">
                  <div className="col-md-3">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Jobs..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Networking">Networking</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <select
                        className="form-select"
                        value={selectedType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <select
                        className="form-select"
                        value={selectedSort}
                        onChange={(e) => handleSortChange(e.target.value)}
                      >
                        <option value="">Sort By</option>
                        <option value="recent">Recently Added</option>
                        <option value="oldest">Oldest First</option>
                        <option value="asc">Title A-Z</option>
                        <option value="desc">Title Z-A</option>
                        <option value="salary">Salary High-Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-1">
                    {(selectedStatus || selectedCategory || selectedType || selectedSort || searchQuery) && (
                      <button
                        className="btn btn-light"
                        onClick={handleClearFilters}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading jobs...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <div className="alert alert-danger">
                    <h6>Error loading jobs</h6>
                    <p>{error}</p>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => fetchAllData()}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Filter Summary */}
                  <div className="px-3 pt-3">
                    <p className="text-muted">
                      Showing {filteredJobs.length} of {jobs.length} jobs
                      {(selectedStatus || selectedCategory || selectedType || selectedSort || searchQuery) && (
                        <span className="ms-2 text-info">
                          (Filters applied:
                          {selectedStatus && ` Status: ${selectedStatus}`}
                          {selectedCategory && ` Category: ${selectedCategory}`}
                          {selectedType && ` Type: ${selectedType}`}
                          {selectedSort && ` Sort: ${selectedSort}`}
                          {searchQuery && ` Search: "${searchQuery}"`}
                          )
                        </span>
                      )}
                    </p>
                  </div>

                  <Table
                    dataSource={filteredJobs}
                    columns={columns}
                    Selection={true}
                  />
                </>
              )}
            </div>
          </div>
          {/* /Jobs List */}
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Footer */}
      <div className="footer d-sm-flex align-items-center justify-content-between">
        <p>2014 - 2025 © Amasqis.</p>
        <p>
          Designed &amp; Developed By{" "}
          <Link to="#" className="text-primary">
            Amasqis
          </Link>
        </p>
      </div>
      {/* /Footer */}

      {/* Modal Components */}
      <AddJob />
      <EditJob />
      <DeleteJob />
    </>
  );
};

export default JobList;