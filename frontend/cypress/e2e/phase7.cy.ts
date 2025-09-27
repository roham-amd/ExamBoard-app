/// <reference types="cypress" />

describe("Authentication flow", () => {
  it("surfaces server errors when login fails", () => {
    cy.intercept("POST", "/auth/login", (req) => {
      expect(req.body).to.deep.equal({ username: "admin", password: "secret" });
      req.reply({ statusCode: 400, body: { detail: "گذرواژه نادرست است." } });
    }).as("login");

    cy.visit("/fa/login");
    cy.get("input#username").type("admin");
    cy.get("input#password").type("secret");
    cy.contains("button", "ورود").click();

    cy.wait("@login");
    cy.contains("گذرواژه نادرست است.").should("be.visible");
  });
});

describe("Public timetable filters", () => {
  it("renders timetable data and filters by search term", () => {
    cy.intercept("GET", "/api/public/allocations*", {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,

            exam_title: "ریاضی ۱",
            allocated_seats: 30,
            starts_at: "2024-01-01T08:00:00Z",
            ends_at: "2024-01-01T10:00:00Z",
            rooms: [{ id: 1, name: "سالن ۱", capacity: 40 }],
          },
          {
            id: 2,
            exam_title: "فیزیک ۱",
            allocated_seats: 20,
            starts_at: "2024-01-02T08:00:00Z",
            ends_at: "2024-01-02T10:00:00Z",
            rooms: [{ id: 2, name: "سالن ۲", capacity: 35 }],
          },
        ],
      },
    }).as("getPublicAllocations");

    cy.visit("/public/terms/1/timetable");
    cy.wait("@getPublicAllocations");
    cy.contains("فیزیک ۱").should("be.visible");

    cy.get('input[type="search"]').type("ریاضی");
    cy.contains("ریاضی ۱").should("be.visible");
    cy.contains("فیزیک ۱").should("not.exist");
  });
});

describe("Dashboard exam and allocation flow", () => {
  it("creates an exam and handles allocation capacity conflicts", () => {
    const exams: Array<Record<string, any>> = [];
    const rooms = [
      { id: 1, name: "سالن ۱", capacity: 30 },
      { id: 2, name: "سالن ۲", capacity: 40 },
    ];

    cy.intercept("GET", "/api/terms/**", {
      statusCode: 200,
      body: {
        count: 1,
        results: [
          {
            id: 1,
            name: "پاییز ۱۴۰۳",
            slug: "fall-1403",
            starts_at: "2024-09-01",
            ends_at: "2025-01-01",
            is_active: true,
          },
        ],
      },
    }).as("getTerms");

    cy.intercept("GET", "/api/exams/owners/**", {
      statusCode: 200,
      body: [{ id: 1, full_name: "دکتر آزمون" }],
    }).as("getOwners");

    cy.intercept("GET", "/api/exams/**", (req) => {
      req.reply({
        statusCode: 200,
        body: { count: exams.length, results: exams },
      });
    }).as("getExams");

    cy.intercept("POST", "/api/exams/", (req) => {
      const payload = req.body as Record<string, any>;
      const exam = {
        id: exams.length + 1,
        title: payload.title,
        course_code: payload.course_code,
        owner: payload.owner,
        owner_name: "دکتر آزمون",
        expected_students: payload.expected_students,
        duration_minutes: payload.duration_minutes,
        term: payload.term,
        term_name: "پاییز ۱۴۰۳",
        status: "draft",
        notes: payload.notes ?? null,
      };
      exams.unshift(exam);
      req.reply({ statusCode: 201, body: exam });
    }).as("createExam");

    cy.intercept("GET", "/api/rooms/**", {
      statusCode: 200,
      body: { count: rooms.length, results: rooms },
    }).as("getRooms");

    cy.intercept("GET", "/api/allocations/**", {
      statusCode: 200,
      body: { count: 0, results: [] },
    }).as("getAllocations");

    cy.intercept("POST", "/api/allocations/", (req) => {
      expect(req.body).to.include({ exam: 1 });
      req.reply({
        statusCode: 400,
        body: { detail: "ظرفیت کافی نیست.", code: "CAPACITY_OVERFLOW" },
      });
    }).as("createAllocationFail");

    cy.visit("/fa/exams");
    cy.wait(["@getExams", "@getTerms", "@getOwners"]);

    cy.contains("افزودن امتحان").click();
    cy.get('input[name="title"]').type("ریاضی ۲");
    cy.get('input[name="course_code"]').type("MATH102");
    cy.contains("label", "مسئول اجرا").parent().find("select").select("1");
    cy.get('input[name="expected_students"]').clear().type("45");
    cy.get('input[name="duration_minutes"]').clear().type("90");
    cy.contains("label", "نیمسال مربوط").parent().find("select").select("1");
    cy.get('textarea[name="notes"]').type("امتحان ویژه پاییز");
    cy.contains("button", "ایجاد").click();

    cy.wait("@createExam");
    cy.contains("ریاضی ۲").should("be.visible");

    cy.visit("/fa/allocations");
    cy.wait(["@getAllocations", "@getRooms", "@getExams"]);

    cy.contains("افزودن تخصیص").click();
    cy.contains("label", "انتخاب امتحان").parent().find("select").select("1");
    cy.contains("label", "سالن‌های مورد استفاده")
      .parent()
      .find("select")
      .select(["1", "2"]);
    cy.contains("label", "شروع")
      .parent()
      .find("input")
      .type("2024-01-01T08:00");
    cy.contains("label", "پایان")
      .parent()
      .find("input")
      .type("2024-01-01T10:00");
    cy.get('input[name="allocated_seats"]').clear().type("60");
    cy.contains("button", "ایجاد").click();

    cy.wait("@createAllocationFail");
    cy.contains("ظرفیت کافی نیست.").should("be.visible");
  });
});
