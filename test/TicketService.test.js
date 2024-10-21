import TicketService from '../src/pairtest/TicketService.js'
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js'
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js'
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js'
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js'

jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService.js')
jest.mock('../src/thirdparty/seatbooking/SeatReservationService.js')

describe('TicketService', () => {
	let ticketService

	beforeEach(() => {
		ticketService = new TicketService()
		TicketPaymentService.mockClear()
		SeatReservationService.mockClear()
	})

	test('should throw an error if accountId is invalid', () => {
		expect(() => {
			ticketService.purchaseTickets(0, new TicketTypeRequest('ADULT', 1))
		}).toThrow(TypeError)
	})

	test('should throw an error if more than 25 tickets are purchased', () => {
		const requests = Array(26).fill(new TicketTypeRequest('ADULT', 1))
		expect(() => {
			ticketService.purchaseTickets(1, ...requests)
		}).toThrow(InvalidPurchaseException)
	})

	test('should throw an error if no adult ticket is purchased with child or infant tickets', () => {
		expect(() => {
			ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 1))
		}).toThrow(InvalidPurchaseException)

		expect(() => {
			ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1))
		}).toThrow(InvalidPurchaseException)
	})

	test('should calculate the correct amount and reserve the correct number of seats', () => {
		const requests = [
			new TicketTypeRequest('ADULT', 3),
			new TicketTypeRequest('CHILD', 2),
			new TicketTypeRequest('INFANT', 1),
		]

		ticketService.purchaseTickets(1, ...requests)

		expect(TicketPaymentService.prototype.makePayment).toHaveBeenCalledWith(
			1,
			105
		)
		expect(SeatReservationService.prototype.reserveSeat).toHaveBeenCalledWith(
			1,
			5
		)
	})

	test('should handle multiple ticket types correctly', () => {
		const requests = [
			new TicketTypeRequest('ADULT', 1),
			new TicketTypeRequest('CHILD', 2),
			new TicketTypeRequest('INFANT', 3),
		]

		ticketService.purchaseTickets(1, ...requests)

		expect(TicketPaymentService.prototype.makePayment).toHaveBeenCalledWith(
			1,
			55
		)
		expect(SeatReservationService.prototype.reserveSeat).toHaveBeenCalledWith(
			1,
			3
		)
	})
})
