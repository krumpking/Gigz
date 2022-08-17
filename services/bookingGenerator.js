const PDFGenerator = require('pdfkit')
const fs = require('fs')

class BookingGenerator {
    constructor(q) {
        this.q = q
    }

    generateHeaders(doc) {
        // const billingAddress = this.q.addresses.billing

        doc
            // .image('./home/unashe/Documents/repository/mkbot/services/logo.png', 0, 0, { width: 250 })
            // .fillColor('#000')
            .fontSize(20)
            .text(`${this.q.name} Bookings`, 275, 50, { align: 'right' })
            .fontSize(10)
            // .text(`Quotation Number: ${this.q.qNumber}`, { align: 'right' })
            .text(`Date released: ${this.q.releasedDate}`, { align: 'right' })
            // .text(`Balance Due: $${this.q.subtotal}`, { align: 'right' })
            .moveDown();
        // .text(`Billing Address:\n ${billingAddress.name}\n${billingAddress.address}\n${billingAddress.city}\n${billingAddress.state},${billingAddress.country}, ${billingAddress.postalCode}`, { align: 'right' })

        const beginningOfPage = 50
        const endOfPage = 550

        doc.moveTo(beginningOfPage, 200)
            .lineTo(endOfPage, 200)
            .stroke()

    }

    generateTable(doc) {
        const tableTop = 270
        const itemCodeX = 50
        const descriptionX = 100
        const quantityX = 250
        const priceX = 300
        const amountX = 350



        doc
            .fontSize(10)
            .text('Name', itemCodeX, tableTop, { bold: true })
            .text('Description', descriptionX, tableTop)
            .text('Date of booking', quantityX, tableTop)
            .text('Date of return', priceX, tableTop)
            .text('Amount', amountX, tableTop)

        const items = this.q.items
        let i = 0


        for (i = 0; i < items.length; i++) {
            const item = items[i]
            const y = tableTop + 25 + (i * 25)

            doc
                .fontSize(10)
                .text(item.itemCode, itemCodeX, y)
                .text(item.description, descriptionX, y)
                // .text(item.quantity, quantityX, y)
                .text(`$ ${item.price}`, priceX, y)
                .text(`$ ${item.amount}`, amountX, y)
        }
        doc
            .fontSize(10)
            .text("Total", priceX, tableTop + 25 + (items.length * 25))
            .text(`$ ${this.q.subtotal}`, amountX, tableTop + 25 + (items.length * 25))


    }

    generateFooter(doc) {


        doc
            .fontSize(10)
            .text(`Payment due upon receipt. `, 50, 700, {
                align: 'center'
            })
    }

    generate() {
        let theOutput = new PDFGenerator

        const fileName = `${this.q.name} quotation ${this.q.qNumber}.pdf`

        // pipe to a writable stream which would save the result into the same directory
        theOutput.pipe(fs.createWriteStream(fileName))

        this.generateHeaders(theOutput)

        theOutput.moveDown()

        this.generateTable(theOutput)

        this.generateFooter(theOutput)


        // write out file
        theOutput.end()

    }
}

module.exports = BookingGenerator