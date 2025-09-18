import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import CommonSelect from '../../core/common/commonSelect';
import { useSocket } from "../../SocketContext";
import { Socket } from "socket.io-client";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { format, parse } from "date-fns";

type TrainingRow = {
  trainingType: string;
  trainer: string;
  employee: string;
  startDate: string;
  endDate: string;
  timeDuration: string;
  desc: string;
  cost: string;
  status: string;
  trainingId: string;
};

type Stats = {
  totalTrainingList: string;
};

const TrainingList = () => {

    const socket = useSocket() as Socket | null;
    const [rows, setRows] = useState<TrainingRow[]>([]);
    const [stats, setStats] = useState<Stats>({ totalTrainingList: "0",});
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string>("last7days");
    const [editing, setEditing] = useState<any>(null);
    const [customRange, setCustomRange] = useState<{ startDate?: string; endDate?: string }>({});
    
    const [editForm, setEditForm] = useState({
      trainingType: "",
      trainer: "",
      employee: "",
      startDate: "",
      endDate: "",
      desc: "",
      cost: "",
      status: "Active",
      trainingId: "",
    });

    const openEditModal = (row: any) => {
      setEditForm({
          trainingType: row.trainingType || "",
          trainer: row.trainer || "",
          employee: row.employee || "",
          startDate: row.startDate || "",
          endDate: row.endDate || "",
          desc: row.desc || "",
          cost: row.cost || "",
          status: row.status || "Active",
          trainingId: row.trainingId,
      });
    };

    const getModalContainer = () => {
      const modalElement = document.getElementById("modal-datepicker");
      return modalElement ? modalElement : document.body;
    };

    const [addForm, setAddForm] = useState({
      trainingType: "",
      trainer: "",
      employee: "",
      startDate: "",
      endDate: "",
      desc: "",
      cost: "",
      status: "Active",
    });

    const confirmDelete = (onConfirm: () => void) => {
      Modal.confirm({
        title: null,
        icon: null,
        closable: true,
        centered: true,
        okText: "Yes, Delete",
        cancelText: "Cancel",
        okButtonProps: { style: { background: "#ff4d4f", borderColor: "#ff4d4f" } },
        cancelButtonProps: { style: { background: "#f5f5f5" } },
        content: (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 12px",
                borderRadius: 12,
                background: "#ffecec",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <a aria-label="Delete">
                <DeleteOutlined style={{ fontSize: 18, color: "#ff4d4f" }} />
              </a>
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
              Confirm Delete
            </div>
            <div style={{ color: "#6b7280" }}>
              You want to delete all the marked items, this can’t be undone once you delete.
            </div>
          </div>
        ),
        onOk: async () => {
          await onConfirm();
        },
      });
    };

    const onListResponse = useCallback((res: any) => {
      if (res?.done) {
        setRows(res.data || []);
      } else {
        setRows([]);
      }
      setLoading(false);
    }, []);

    const onStatsResponse = useCallback((res: any) => {
      if (res?.done && res.data) {
        setStats(res.data);
      }
    }, []);

    const onAddResponse = useCallback((res: any) => {
      // feedback only; list and stats will be broadcast from controller
      if (!res?.done) {
        // toast.error(res?.message || "Failed to add training");
      }
    }, []);

    const onUpdateResponse = useCallback((res: any) => {
      if (!res?.done) {
        // toast.error(res?.message || "Failed to update training");
      }
    }, []);

    const onDeleteResponse = useCallback((res: any) => {
      if (res?.done) {
        setSelectedKeys([]);
      } else {
        // toast.error(res?.message || "Failed to delete");
      }
    }, []);

    useEffect(() => {
      if (!socket) return;

      socket.emit("join-room", "hr_room");

      socket.on("hr/trainingList/trainingListlist-response", onListResponse);
      socket.on("hr/trainingList/trainingList-details-response", onStatsResponse);
      socket.on("hr/trainingList/add-trainingList-response", onAddResponse);
      socket.on("hr/trainingList/update-trainingList-response", onUpdateResponse);
      socket.on("hr/trainingList/delete-trainingList-response", onDeleteResponse);

      return () => {
        socket.off("hr/trainingList/trainingListlist-response", onListResponse);
        socket.off("hr/trainingList/trainingList-details-response", onStatsResponse);
        socket.off("hr/trainingList/add-trainingList-response", onAddResponse);
        socket.off("hr/trainingList/update-trainingList-response", onUpdateResponse);
        socket.off("hr/trainingList/delete-trainingList-response", onDeleteResponse);
      };
    }, [socket, onListResponse, onStatsResponse, onAddResponse, onUpdateResponse, onDeleteResponse]);

    const fetchList = useCallback(
      (type: string, range?: { startDate?: string; endDate?: string }) => {
        if (!socket) return;
        setLoading(true);
        const payload: any = { type };
        if (type === "custom" && range?.startDate && range?.endDate) {
          payload.startDate = range.startDate;
          payload.endDate = range.endDate;
        }
        socket.emit("hr/trainingList/trainingListlist", payload);
      },
      [socket]
    );

      const toIsoFromDDMMYYYY = (s: string) => {
        // s like "13-09-2025"
          const [dd, mm, yyyy] = s.split("-").map(Number);
          if (!dd || !mm || !yyyy) return null;
        // Construct UTC date to avoid TZ shifts
          const d = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
          return isNaN(d.getTime()) ? null : d.toISOString();
        };

    const fmtYMD = (s: string) :string => {
      const [dd, mm, yyyy] = s.split("-").map(Number);
      const d = new Date(Date.UTC(yyyy, (mm ?? 1) - 1, dd ?? 1));
      const parts = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).formatToParts(d);
      const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
      // Some locales include commas; rebuild explicitly as "16 Jan 2026"
      return `${get('day')} ${get('month')} ${get('year')}`;
    };


    const handleAddSave = () => {
        if (!socket) return;

        // basic validation
        if (!addForm.trainingType || !addForm.trainer || !addForm.employee || !addForm.startDate || !addForm.endDate || !addForm.desc || !addForm.cost || !addForm.status) {
          // toast.warn("Please fill required fields");
          return;
      }
      
      const startIso = toIsoFromDDMMYYYY(addForm.startDate);
      const endIso = toIsoFromDDMMYYYY(addForm.endDate);
      const startfmt= fmtYMD(addForm.startDate);
      const endfmt = fmtYMD(addForm.endDate)
      const timeDurationfmt= startfmt+" - "+endfmt;

      const payload = {
          trainingType: addForm.trainingType,
          trainer: addForm.trainer,
          employee: addForm.employee,
          startDate: startIso,
          endDate: endIso,
          timeDuration: timeDurationfmt,
          desc: addForm.desc,
          cost: addForm.cost,
          status: addForm.status as "Active" | "Inactive",
      };

      socket.emit("hr/trainingList/add-trainingList", payload);
      // modal has data-bs-dismiss; optional: reset form
      setAddForm({
        trainingType: "",
        trainer: "",
        employee: "",
        startDate: "",
        endDate: "",
        desc: "",
        cost: "",
        status: "Active",
      });
      socket.emit("hr/trainingList/trainingListlist", { type: "last7days" });
    };

    const handleEditSave = () => {
        if (!socket) return;

      // basic validation
        if (!editForm.trainingType || !editForm.trainer || !editForm.employee || !editForm.startDate || !editForm.endDate || !editForm.desc || !editForm.cost || !editForm.status || !editForm.trainingId) {
        // toast.warn("Please fill required fields");
          return;
      }

      const startiso=toIsoFromDDMMYYYY(editForm.startDate);
      const endiso=toIsoFromDDMMYYYY(editForm.endDate);
      const startfmt = fmtYMD(editForm.startDate);
      const endfmt = fmtYMD(editForm.endDate);
    
      const timeDurationfmt= startfmt+" - "+endfmt;

      const payload = {
          trainingType: editForm.trainingType,
          trainer: editForm.trainer,
          employee: editForm.employee,
          startDate: startiso,
          endDate: endiso,
          timeDuration: timeDurationfmt,
          desc: editForm.desc,
          cost: editForm.cost,
          status: editForm.status as "Active" | "Inactive",
          trainingId: editForm.trainingId,
      };

      socket.emit("hr/trainingList/update-trainingList", payload);
      // modal has data-bs-dismiss; optional: reset form
      setEditForm({
          trainingType: "",
          trainer: "",
          employee: "",
          startDate: "",
          endDate: "",
          desc: "",
          cost: "",
          status: "Active",
          trainingId: "",
      });
      socket.emit("hr/trainingList/trainingListlist", { type: "last7days" });
    };

    const fetchStats = useCallback(() => {
      if (!socket) return;
      socket.emit("hr/trainingList/trainingList-details");
    }, [socket]);

    useEffect(() => {
      if (!socket) return;
      fetchList(filterType, customRange);
      fetchStats();
    }, [socket, fetchList, fetchStats, filterType, customRange]);

    type Option = { value: string; label: string };
     
    const handleFilterChange = (opt: Option | null) => {
      const value = opt?.value ?? "last7days";
      setFilterType(value);
      if (value !== "custom") {
        setCustomRange({});
        fetchList(value);
      }
    };

    const handleCustomRange = (_: any, dateStrings: [string, string]) => {
      if (dateStrings && dateStrings[0] && dateStrings[1]) {
        const range = { startDate: dateStrings[0], endDate: dateStrings[1] };
        setCustomRange(range);
        fetchList("custom", range);
      }
    };

    const handleBulkDelete = () => {
      if (!socket || selectedKeys.length === 0) return;
      if (window.confirm(`Delete ${selectedKeys.length} record(s)? This cannot be undone.`)) {
        socket.emit("hr/trainingList/delete-trainingList", selectedKeys);
      }
    };

    const handleSelectionChange = (keys: React.Key[]) => {
      setSelectedKeys(keys as string[]);
    };

  const routes = all_routes;
  const columns = [
    {
      title: "Training Type",
      dataIndex: "trainingType",
      sorter: (a: TrainingRow, b: TrainingRow) => a.trainingType.localeCompare(b.trainingType),
    },
    {
      title: "Trainer",
      dataIndex: "trainer",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath
              src={`assets/img/users/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{text}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: TrainingRow, b: TrainingRow) => a.trainer.localeCompare(b.trainer),
    },
    {
      title: "Employee",
      dataIndex: "employee",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath
              src={`assets/img/users/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{text}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: TrainingRow, b: TrainingRow) => a.employee.localeCompare(b.employee),
    },
    {
      title: "Time Duration",
      dataIndex: "timeDuration",
      sorter: (a: TrainingRow, b: TrainingRow) => a.timeDuration.localeCompare(b.timeDuration),
    },
    {
      title: "Description",
      dataIndex: "desc",
      sorter: (a: TrainingRow, b: TrainingRow) => a.desc.localeCompare(b.desc),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      sorter: (a: TrainingRow, b: TrainingRow) => a.desc.localeCompare(b.desc),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
          { text: "Active", value: "Active" },
          { text: "Inactive", value: "Inactive" },
        ],
        render: (text: string) => {
        const isActive = text === "Active";
        const cls = `badge ${isActive ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`;
        return (
          <span className={cls}>
          <i className="ti ti-point-filled me-1" />
           {text}
          </span>
        );
        },
      onFilter: (val: any, rec: any) => rec.status === val,
      sorter: (a: TrainingRow, b: TrainingRow) => a.status.localeCompare(b.status),
    },
    {
      title: "",
      dataIndex: "trainingId",
      render: (id: string, record: TrainingRow) => (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#"
              data-bs-toggle="modal"
              data-bs-target="#edit_training"
              onClick={(e) => {
                // still prefill the form before Bootstrap opens it
                openEditModal(record);
              }}>
                <i className="ti ti-edit" />
              </a>
            <a
              aria-label="Delete"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete(() =>
                  socket?.emit("hr/trainingList/delete-trainingList", [record.trainingId]));
              }}
            >
              <i className="ti ti-trash" />
            </a>
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
              <h2 className="mb-1">Training</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item">Training</li>
                  <li className="breadcrumb-item">Training List</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#new_training"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Training
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Performance Indicator list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Training List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <Link
                        to="#"
                        className="d-inline-flex align-items-center fs-12"
                      >
                        <label className="fs-12 d-inline-flex me-1">Sort By : </label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: "today", label: "Today" },
                            { value: "yesterday", label: "Yesterday" },
                            { value: "last7days", label: "Last 7 Days" },
                            { value: "last30days", label: "Last 30 Days" },
                            { value: "thismonth", label: "This Month" },
                            { value: "lastmonth", label: "Last Month" },
                            { value: "thisyear", label: "This Year" },
                          ]}
                          defaultValue={filterType}
                          onChange={handleFilterChange}
                        />
                    </Link>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={rows} columns={columns} Selection={true} />
            </div>
          </div>
          {/* /Performance Indicator list */}
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add Training */}
        <div className="modal fade" id="new_training">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Training</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form>
                <div className="modal-body pb-0">
                  <div className="row">
                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Training Type
                            </label>
                            <textarea
                              className="form-control"
                              rows={1} value={addForm.trainingType} onChange ={(e) => setAddForm({ ...addForm, trainingType: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Trainer
                            </label>
                            <textarea
                              className="form-control"
                              rows={1} value={addForm.trainer} onChange ={(e) => setAddForm({ ...addForm, trainer: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Employee
                            </label>
                            <textarea
                              className="form-control"
                              rows={1} value={addForm.employee} onChange ={(e) => setAddForm({ ...addForm, employee: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Training Cost
                            </label>
                            <textarea
                              className="form-control"
                              rows={1} value={addForm.cost} onChange ={(e) => setAddForm({ ...addForm, cost: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Start Date
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY" onChange={(_, dateString) => setAddForm({ ...addForm, startDate: dateString as string })}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar text-gray-7" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              End Date
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY" onChange={(_, dateString) => setAddForm({ ...addForm, endDate: dateString as string })}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar text-gray-7" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          rows={2} value={addForm.desc} onChange ={(e) => setAddForm({ ...addForm, desc: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                            ]}
                          defaultValue={addForm.status} onChange={(opt: { value: string } | null) => setAddForm({ ...addForm, status: opt?.value ?? "Active" })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-white border me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-primary"
                    onClick={handleAddSave}
                  >
                    Add Training
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Add Trainer */}
        {/* Edit Trainer */}
        <div className="modal fade" id="edit_training">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Training</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form>
                <div className="modal-body pb-0">
                  <div className="row">
                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Training Type&nbsp;
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={editForm.trainingType}
                              onChange={(e) => setEditForm({ ...editForm, trainingType: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Trainer</label>
                            <textarea
                              className="form-control"
                              rows={1}
                              value={editForm.trainer}
                              onChange={(e) => setEditForm({ ...editForm, trainer: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Employee</label>
                            <textarea
                              className="form-control"
                              rows={1}
                              value={editForm.employee}
                              onChange={(e) => setEditForm({ ...editForm, employee: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Cost</label>
                            <textarea
                              className="form-control"
                              rows={1}
                              value={editForm.cost}
                              onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row g-3">                
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Start Date
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY" 
                                defaultValue={editForm.startDate ? dayjs(editForm.startDate, "DD-MM-YYYY") : null}
                                onChange={(_, dateString) => setEditForm({ ...editForm, startDate: dateString as string })}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar text-gray-7" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              End Date
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY" 
                                defaultValue={editForm.endDate ? dayjs(editForm.endDate, "DD-MM-YYYY") : null}
                                onChange={(_, dateString) => setEditForm({ ...editForm, endDate: dateString as string })}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar text-gray-7" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>


                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editForm.desc}
                          onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <CommonSelect
                          className="select"
                          defaultValue={editForm.status}
                          onChange={(opt: { value: string } | null) => setEditForm({ ...editForm, status: opt?.value ?? "Active" })}
                          options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                            ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-white border me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-primary"
                    onClick={handleEditSave}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Edit Training */}     
    </>
  );
};

export default TrainingList;
