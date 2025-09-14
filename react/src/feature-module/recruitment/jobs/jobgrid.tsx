import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import { useJobs } from "../../../hooks/useJobs";
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

const JobGrid = () => {
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
    console.log("JobGrid component mounted");
    fetchAllData();
    fetchStats();
  }, [fetchAllData, fetchStats]);

  // Apply filters whenever jobs or filter states change
  useEffect(() => {
    console.log("[JobGrid] Applying filters...");
    console.log("[JobGrid] Current filters:", {
      selectedStatus,
      selectedCategory,
      selectedType,
      selectedSort,
      searchQuery,
    });
    console.log("[JobGrid] Total jobs before filtering:", jobs.length);

    if (!jobs || jobs.length === 0) {
      setFilteredJobs([]);
      return;
    }

    let result = [...jobs];

    // Status filter
    if (selectedStatus && selectedStatus !== '') {
      console.log("[JobGrid] Filtering by status:", selectedStatus);
      result = result.filter((job) => job.status === selectedStatus);
      console.log("[JobGrid] After status filter:", result.length);
    }

    // Category filter
    if (selectedCategory && selectedCategory !== '') {
      console.log("[JobGrid] Filtering by category:", selectedCategory);
      result = result.filter((job) => job.category === selectedCategory);
      console.log("[JobGrid] After category filter:", result.length);
    }

    // Type filter
    if (selectedType && selectedType !== '') {
      console.log("[JobGrid] Filtering by type:", selectedType);
      result = result.filter((job) => job.type === selectedType);
      console.log("[JobGrid] After type filter:", result.length);
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      console.log("[JobGrid] Filtering by search query:", searchQuery);
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
      console.log("[JobGrid] After search filter:", result.length);
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

    console.log("[JobGrid] Final filtered jobs count:", result.length);
    setFilteredJobs(result);
  }, [jobs, selectedStatus, selectedCategory, selectedType, selectedSort, searchQuery]);

  // Handle filter changes
  const handleStatusChange = (status: string) => {
    console.log("[JobGrid] Status filter changed to:", status);
    setSelectedStatus(status);
  };

  const handleCategoryChange = (category: string) => {
    console.log("[JobGrid] Category filter changed to:", category);
    setSelectedCategory(category);
  };

  const handleTypeChange = (type: string) => {
    console.log("[JobGrid] Type filter changed to:", type);
    setSelectedType(type);
  };

  const handleSortChange = (sort: string) => {
    console.log("[JobGrid] Sort filter changed to:", sort);
    setSelectedSort(sort);
  };

  const handleSearchChange = (query: string) => {
    console.log("[JobGrid] Search query changed to:", query);
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    console.log("[JobGrid] Clearing all filters");
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

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

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
                    Job Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
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

          {/* Jobs Grid */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Job Grid</h5>
              {/* Search Input */}
              <div className="input-icon-end position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Jobs..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <span className="input-icon-addon">
                  <i className="ti ti-search text-gray-7"></i>
                </span>
              </div>
            </div>

            <div className="card-body">
              {/* Filter Row */}
              <div className="row mb-3">
                {/* Status Filter */}
                <div className="col-md-3">
                  <div className="dropdown">
                    <button
                      className="btn btn-white dropdown-toggle w-100 d-flex align-items-center justify-content-between"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      {selectedStatus ? `Status: ${selectedStatus}` : 'Select Status'}
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('');
                          }}
                        >
                          All Status
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('Active');
                          }}
                        >
                          Active
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleStatusChange('Inactive');
                          }}
                        >
                          Inactive
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="col-md-3">
                  <div className="dropdown">
                    <button
                      className="btn btn-white dropdown-toggle w-100 d-flex align-items-center justify-content-between"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      {selectedCategory ? `Category: ${selectedCategory}` : 'Select Category'}
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange('');
                          }}
                        >
                          All Categories
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange('Software');
                          }}
                        >
                          Software
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange('Hardware');
                          }}
                        >
                          Hardware
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleCategoryChange('Design');
                          }}
                        >
                          Design
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Type Filter */}
                <div className="col-md-3">
                  <div className="dropdown">
                    <button
                      className="btn btn-white dropdown-toggle w-100 d-flex align-items-center justify-content-between"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      {selectedType ? `Type: ${selectedType}` : 'Select Type'}
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTypeChange('');
                          }}
                        >
                          All Types
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTypeChange('Full Time');
                          }}
                        >
                          Full Time
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTypeChange('Part Time');
                          }}
                        >
                          Part Time
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleTypeChange('Contract');
                          }}
                        >
                          Contract
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Sort Filter */}
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <div className="dropdown flex-grow-1">
                      <button
                        className="btn btn-white dropdown-toggle w-100 d-flex align-items-center justify-content-between"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        {selectedSort
                          ? `Sort: ${
                              selectedSort === 'asc'
                                ? 'A-Z'
                                : selectedSort === 'desc'
                                ? 'Z-A'
                                : selectedSort === 'recent'
                                ? 'Recent'
                                : selectedSort === 'oldest'
                                ? 'Oldest'
                                : 'Salary'
                            }`
                          : 'Sort By'}
                      </button>
                      <ul className="dropdown-menu w-100">
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSortChange('recent');
                            }}
                          >
                            Recently Added
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSortChange('oldest');
                            }}
                          >
                            Oldest First
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSortChange('asc');
                            }}
                          >
                            Title A-Z
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSortChange('desc');
                            }}
                          >
                            Title Z-A
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSortChange('salary');
                            }}
                          >
                            Salary High-Low
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Clear Filters */}
                    {(selectedStatus || selectedCategory || selectedType || selectedSort || searchQuery) && (
                      <button
                        className="btn btn-light"
                        onClick={(e) => {
                          e.preventDefault();
                          handleClearFilters();
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Summary */}
              {!loading && !error && (
                <div className="mb-3">
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
              )}

              {/* Jobs Grid Content */}
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
                <div className="row">
                  {filteredJobs.map((job: Job) => (
                    <div className="col-xl-4 col-lg-6 d-flex" key={job._id}>
                      <div className="card flex-fill">
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-md bg-light-gray rounded me-2">
                                <i className="ti ti-briefcase fs-16"></i>
                              </div>
                              <div>
                                <h6 className="fw-medium mb-1">
                                  <Link to={all_routes.jobdetails}>{job.title}</Link>
                                </h6>
                                <span
                                  className={`badge ${
                                    job.status === "Active"
                                      ? "badge-soft-success"
                                      : "badge-soft-warning"
                                  }`}
                                >
                                  {job.status}
                                </span>
                              </div>
                            </div>
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
                                      handleEditJob(job);
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
                                      handleDeleteJob(job);
                                    }}
                                  >
                                    <i className="ti ti-trash me-2"></i>Delete
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <div className="mb-3">
                            <p className="mb-2">
                              <i className="ti ti-users me-1"></i>
                              <span className="fw-medium">{job.appliedCount || 0} Applicants</span>
                            </p>
                            <p className="mb-2">
                              <i className="ti ti-map-pin me-1"></i>
                              {job.location?.city}, {job.location?.state}, {job.location?.country}
                            </p>
                            <p className="mb-2">
                              <i className="ti ti-currency-dollar me-1"></i>
                              {job.salaryRange?.min?.toLocaleString()} - {job.salaryRange?.max?.toLocaleString()} {job.salaryRange?.currency} / month
                            </p>
                            <p className="mb-2">
                              <i className="ti ti-clock me-1"></i>
                              {job.type}
                            </p>
                            <p className="mb-0">
                              <i className="ti ti-briefcase me-1"></i>
                              {job.numberOfPositions} position{job.numberOfPositions > 1 ? 's' : ''} available
                            </p>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center flex-wrap">
                              <span className="badge badge-soft-info me-1 mb-1">{job.category}</span>
                              <span className="badge badge-soft-secondary me-1 mb-1">{job.type}</span>
                              {job.skills && job.skills.slice(0, 2).map((skill, index) => (
                                <span key={index} className="badge badge-soft-primary me-1 mb-1">
                                  {skill}
                                </span>
                              ))}
                              {job.skills && job.skills.length > 2 && (
                                <span className="badge badge-soft-light me-1 mb-1">
                                  +{job.skills.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* /Jobs Grid */}
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

export default JobGrid;