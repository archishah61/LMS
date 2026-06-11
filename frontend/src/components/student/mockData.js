export const mockEnrollments = [
  {
    id: 1,
    user: {
      username: "john_doe",
      email: "john@example.com"
    },
    course: {
      id: 1,
      name: "Advanced React Development"
    },
    enrollment_date: new Date("2024-01-15"),
    expiry_date: new Date("2024-07-15"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 1250,
      last_accessed: new Date("2024-03-10")
    },
    payments: [
      {
        amount: 299.99,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-01-15")
      }
    ]
  },
  {
    id: 2,
    user: {
      username: "sarah_smith",
      email: "sarah@example.com"
    },
    course: {
      id: 2,
      name: "UI/UX Design Fundamentals"
    },
    enrollment_date: new Date("2024-02-01"),
    expiry_date: new Date("2024-08-01"),
    status: "active",
    progress: {
      completion_status: "completed",
      time_spent: 2800,
      last_accessed: new Date("2024-03-09")
    },
    payments: [
      {
        amount: 199.99,
        status: "completed",
        payment_method: "paypal",
        created_at: new Date("2024-02-01")
      }
    ]
  },
  {
    id: 3,
    user: {
      username: "mike_johnson",
      email: "mike@example.com"
    },
    course: {
      id: 3,
      name: "Python for Data Science"
    },
    enrollment_date: new Date("2024-01-20"),
    expiry_date: new Date("2024-07-20"),
    status: "expired",
    progress: {
      completion_status: "not_started",
      time_spent: 0,
      last_accessed: new Date("2024-01-20")
    },
    payments: [
      {
        amount: 399.99,
        status: "pending",
        payment_method: "bank_transfer",
        created_at: new Date("2024-01-20")
      }
    ]
  },
  {
    id: 4,
    user: {
      username: "emily_brown",
      email: "emily@example.com"
    },
    course: {
      id: 4,
      name: "JavaScript: The Complete Guide"
    },
    enrollment_date: new Date("2024-02-15"),
    expiry_date: new Date("2024-08-15"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 800,
      last_accessed: new Date("2024-03-05")
    },
    payments: [
      {
        amount: 149.50,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-02-15")
      }
    ]
  },
  {
    id: 5,
    user: {
      username: "david_wilson",
      email: "david@example.com"
    },
    course: {
      id: 5,
      name: "Machine Learning A-Z"
    },
    enrollment_date: new Date("2024-03-01"),
    expiry_date: new Date("2024-09-01"),
    status: "active",
    progress: {
      completion_status: "completed",
      time_spent: 3500,
      last_accessed: new Date("2024-03-08")
    },
    payments: [
      {
        amount: 499.00,
        status: "completed",
        payment_method: "paypal",
        created_at: new Date("2024-03-01")
      }
    ]
  },
  {
    id: 6,
    user: {
      username: "linda_rodriguez",
      email: "linda@example.com"
    },
    course: {
      id: 6,
      name: "Ethical Hacking Course"
    },
    enrollment_date: new Date("2024-02-20"),
    expiry_date: new Date("2024-08-20"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 2000,
      last_accessed: new Date("2024-03-11")
    },
    payments: [
      {
        amount: 249.99,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-02-20")
      }
    ]
  },
  {
    id: 7,
    user: {
      username: "kevin_nguyen",
      email: "kevin@example.com"
    },
    course: {
      id: 7,
      name: "AWS Certified Solutions Architect"
    },
    enrollment_date: new Date("2024-01-10"),
    expiry_date: new Date("2024-07-10"),
    status: "expired",
    progress: {
      completion_status: "not_started",
      time_spent: 100,
      last_accessed: new Date("2024-01-12")
    },
    payments: [
      {
        amount: 599.00,
        status: "refunded",
        payment_method: "credit_card",
        created_at: new Date("2024-01-10")
      }
    ]
  },
  {
    id: 8,
    user: {
      username: "ashley_perez",
      email: "ashley@example.com"
    },
    course: {
      id: 8,
      name: "Cybersecurity Fundamentals"
    },
    enrollment_date: new Date("2024-03-05"),
    expiry_date: new Date("2024-09-05"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 900,
      last_accessed: new Date("2024-03-12")
    },
    payments: [
      {
        amount: 179.99,
        status: "completed",
        payment_method: "paypal",
        created_at: new Date("2024-03-05")
      }
    ]
  },
  {
    id: 9,
    user: {
      username: "robert_davis",
      email: "robert@example.com"
    },
    course: {
      id: 9,
      name: "Data Structures and Algorithms"
    },
    enrollment_date: new Date("2024-02-28"),
    expiry_date: new Date("2024-08-28"),
    status: "active",
    progress: {
      completion_status: "completed",
      time_spent: 4000,
      last_accessed: new Date("2024-03-10")
    },
    payments: [
      {
        amount: 349.50,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-02-28")
      }
    ]
  },
  {
    id: 10,
    user: {
      username: "jessica_white",
      email: "jessica@example.com"
    },
    course: {
      id: 10,
      name: "Full-Stack Web Development Bootcamp"
    },
    enrollment_date: new Date("2024-03-10"),
    expiry_date: new Date("2024-09-10"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 1500,
      last_accessed: new Date("2024-03-12")
    },
    payments: [
      {
        amount: 799.99,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-03-10")
      }
    ]
  },
  {
    id: 11,
    user: {
      username: "christopher_taylor",
      email: "christopher@example.com"
    },
    course: {
      id: 1,
      name: "Advanced React Development"
    },
    enrollment_date: new Date("2024-03-15"),
    expiry_date: new Date("2024-09-15"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 750,
      last_accessed: new Date("2024-03-15")
    },
    payments: [
      {
        amount: 299.99,
        status: "completed",
        payment_method: "paypal",
        created_at: new Date("2024-03-15")
      }
    ]
  },
  {
    id: 12,
    user: {
      username: "amanda_thomas",
      email: "amanda@example.com"
    },
    course: {
      id: 2,
      name: "UI/UX Design Fundamentals"
    },
    enrollment_date: new Date("2023-12-20"),
    expiry_date: new Date("2024-06-20"),
    status: "expired",
    progress: {
      completion_status: "completed",
      time_spent: 3000,
      last_accessed: new Date("2024-01-10")
    },
    payments: [
      {
        amount: 199.99,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2023-12-20")
      }
    ]
  },
  {
    id: 13,
    user: {
      username: "ryan_hall",
      email: "ryan@example.com"
    },
    course: {
      id: 3,
      name: "Python for Data Science"
    },
    enrollment_date: new Date("2024-02-01"),
    expiry_date: new Date("2024-08-01"),
    status: "active",
    progress: {
      completion_status: "in_progress",
      time_spent: 600,
      last_accessed: new Date("2024-03-14")
    },
    payments: [
      {
        amount: 399.99,
        status: "completed",
        payment_method: "credit_card",
        created_at: new Date("2024-02-01")
      }
    ]
  }
];
