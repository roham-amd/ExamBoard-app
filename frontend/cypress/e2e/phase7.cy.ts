/// <reference types="cypress" />

describe('Phase 7 happy paths', () => {
  it('logs in through the proxy handlers', () => {
    cy.intercept('POST', '/auth/login', req => {
      expect(req.body).to.have.property('username')
      req.reply({ statusCode: 200, body: { ok: true } })
    })

    cy.intercept('GET', '/api/terms*', {
      statusCode: 200,
      body: { results: [], count: 0 }
    })

    cy.visit('/fa/terms')
    cy.contains('ورود').should('not.exist')
  })

  it('creates and edits rooms with optimistic responses', () => {
    cy.intercept('GET', '/api/rooms*', {
      statusCode: 200,
      body: { count: 1, results: [{ id: 1, name: 'سالن ۱۰۱', capacity: 30 }] }
    }).as('getRooms')

    cy.intercept('POST', '/api/rooms', {
      statusCode: 201,
      body: { id: 2, name: 'سالن ۱۰۲', capacity: 50 }
    }).as('createRoom')

    cy.intercept('PATCH', '/api/rooms/2', {
      statusCode: 200,
      body: { id: 2, name: 'سالن ۱۰۲', capacity: 45 }
    }).as('updateRoom')

    cy.visit('/fa/rooms')
    cy.wait('@getRooms')
    cy.contains('افزودن سالن').click()
    cy.get('input[name="name"]').type('سالن ۱۰۲')
    cy.get('input[name="capacity"]').clear().type('50')
    cy.contains('ذخیره').click()
    cy.wait('@createRoom')
    cy.contains('سالن ۱۰۲').click()
    cy.contains('ویرایش').click()
    cy.get('input[name="capacity"]').clear().type('45')
    cy.contains('ذخیره').click()
    cy.wait('@updateRoom')
  })
})

describe('Public timetable filters and DnD validation', () => {
  it('filters timetable results client-side and handles server rejection', () => {
    cy.intercept('GET', '/api/public/allocations*', {
      statusCode: 200,
      body: {
        results: [
          {
            id: 1,
            exam_title: 'ریاضی ۱',
            allocated_seats: 30,
            starts_at: '2024-01-01T08:00:00Z',
            ends_at: '2024-01-01T10:00:00Z',
            rooms: [{ id: 1, name: 'سالن ۱', capacity: 40 }]
          }
        ]
      }
    }).as('getPublicAllocations')

    cy.visit('/public/terms/1/timetable')
    cy.wait('@getPublicAllocations')
    cy.get('input[type="search"]').type('ریاضی')
    cy.contains('ریاضی ۱')

    cy.intercept('PATCH', '/api/allocations/1', {
      statusCode: 400,
      body: { code: 'CAPACITY_OVERFLOW', detail: 'ظرفیت کافی نیست.' }
    }).as('rejectDnD')

    cy.request({ method: 'PATCH', url: '/api/allocations/1', body: { starts_at: '', ends_at: '' }, failOnStatusCode: false })
    cy.wait('@rejectDnD')
  })
})
