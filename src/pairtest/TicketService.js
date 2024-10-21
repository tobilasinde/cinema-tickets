import TicketTypeRequest from './lib/TicketTypeRequest.js'
import InvalidPurchaseException from './lib/InvalidPurchaseException.js'
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js'
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js'

export default class TicketService {
	/**
	 * Should only have private methods other than the one below.
	 */
	purchaseTickets(accountId, ...ticketTypeRequests) {
		// Check if accountId is greater than zero
		if (accountId <= 0) {
			throw new TypeError('Invalid account ID')
		}

		// Get the total number of tickets requested
		const totalTickets = ticketTypeRequests.reduce(
			(sum, req) => sum + req.getNoOfTickets(),
			0
		)

		// Only a maximum of 25 tickets that can be purchased at a time.
		if (totalTickets > 25) {
			throw new InvalidPurchaseException(
				'total number of tickets must not exceed 25'
			)
		}

		// Check if adult ticket is purchased
		const adultTickets = ticketTypeRequests.find(
			(req) => req.getTicketType() === 'ADULT'
		)
		if (!adultTickets) {
			throw new InvalidPurchaseException('adult ticket must be purchased')
		}

		const { totalAmountToPay, totalSeatsToReserve } =
			this.#totalSeatAndTotalAmountToPay(ticketTypeRequests)

		const paymentService = new TicketPaymentService()
		paymentService.makePayment(accountId, totalAmountToPay)

		const reservationService = new SeatReservationService()
		reservationService.reserveSeat(accountId, totalSeatsToReserve)
	}

	/**
	 * @param {TicketTypeRequest[]} ticketTypeRequests
	 */
	#totalSeatAndTotalAmountToPay(ticketTypeRequests) {
		const response = {
			totalAmountToPay: 0,
			totalSeatsToReserve: 0,
		}
		ticketTypeRequests.forEach((req) => {
			const type = req.getTicketType()
			const count = req.getNoOfTickets()
			response.totalAmountToPay += this.#ticketPrices.get(type) * count
			if (type !== 'INFANT') {
				response.totalSeatsToReserve += count
			}
		})
		return response
	}

	#ticketPrices = new Map([
		['INFANT', 0],
		['CHILD', 15],
		['ADULT', 25],
	])
}
