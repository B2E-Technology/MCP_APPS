/* ══════════════════════════════════════════════
   config.js — Social Media User Master
   Edit ONLY this file to customise the list page.
   ══════════════════════════════════════════════ */
const CONFIG = {
  title:    "Social Media User Master",
  subtitle: "get_svv02_user_master_01 · svv02_user_master_01",
  csvName:  "svv02-user-master.csv",
  icon:     "👤",

  /* Primary key */
  idKey: "psk_id",

  /* Feature toggles */
  features: {
    create:  true,
    edit:    true,
    delete:  true,
    search:  true,
    export:  true,
    refresh: true
  },

  /* Column definitions */
  columns: [
    { key: "psk_id",       label: "ID",           type: "number",  editable: false },
    { key: "member_id",    label: "Member ID",     type: "number",  editable: false },
    { key: "firstname",    label: "First Name",    type: "text",    required: true  },
    { key: "lastname",     label: "Last Name",     type: "text",    required: true  },
    { key: "username",     label: "Username",      type: "code",    required: true  },
    { key: "email",        label: "Email",         type: "text",    required: true  },
    { key: "mobile",       label: "Mobile",        type: "text",    required: true  },
    { key: "member_type",  label: "Member Type",   type: "badge",   required: true,
      options: ["guest", "user", "admin"] },
    { key: "user_gender",  label: "Gender",        type: "badge",
      options: ["Male", "Female", "None"] },
    { key: "user_dob",     label: "Date of Birth", type: "date"     },
    { key: "registered_on",label: "Registered",    type: "date",    editable: false },
    { key: "expiry_date",  label: "Expiry Date",   type: "date"     },
    { key: "auth_token",   label: "Auth Token",    type: "code",    editable: false },
    { key: "user_profile", label: "Profile",       type: "text"     },
    { key: "user_intro",   label: "Intro",         type: "text"     },
    { key: "user_bio",     label: "Bio",           type: "text"     },
    { key: "user_address", label: "Address",       type: "text"     },
    { key: "user_father_name", label: "Father Name", type: "text"   },
    { key: "user_kyc",     label: "KYC",           type: "text"     },
  ],

  /* Search */
  searchKeys: ["firstname", "lastname", "username", "email", "mobile"],

  /* Filter pills */
  filterKey: "member_type",

  /* Stat cards */
  stats: [
    { label: "Total Members", filter: "*"     },
    { label: "Users",         filter: "user"  },
    { label: "Guests",        filter: "guest" },
  ],

  /* Badge colours */
  badgeColors: {
    "user":   "#2563EB",
    "guest":  "#7C3AED",
    "admin":  "#059669",
    "Male":   "#0891B2",
    "Female": "#EC4899",
    "None":   "#94A3B8",
  },

  /* Charts */
  charts: {
    bar:   { key: "member_type", label: "Members by Type"   },
    donut: { key: "user_gender", label: "Gender Distribution" },
  },

  /* Dropdown filters */
  filterDropdowns: []
};
