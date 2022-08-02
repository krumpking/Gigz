const PDFGenerator = require('pdfkit')
const fs = require('fs')

class StockGenerator {
    constructor(q) {
        this.q = q
    }

    generateHeaders(doc) {

        doc
            .fontSize(10)
            .text(`Date: ${this.q.dueDate}`, 20, 20, { align: 'right' })
            .moveTo(550, 35)
            .lineTo(30, 35)
            .moveTo(550, 40)
            .lineTo(30, 40)
            .stroke();


    }

    generateTable(doc) {
        const tableTop = 50
        const itemCodeX = 50
        const descriptionX = 30
        const quantityX = 250
        const priceX = 370
        const amountX = 480



        doc
            .fontSize(10)
            .text('Item', descriptionX, tableTop)
            .text('Quantity', quantityX, tableTop)
            .text('Price', priceX, tableTop)
            .text('Amount', amountX, tableTop)

        const items = this.q.items
        let i = 0


        for (i = 0; i < items.length; i++) {
            const item = items[i]
            const y = tableTop + 25 + (i * 25)

            doc
                .fontSize(10)
                .text(item.description, descriptionX, y)
                .text(item.quantity, quantityX, y)
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

        const fileName = `${this.q.name}.pdf`

        // pipe to a writable stream which would save the result into the same directory
        theOutput.pipe(fs.createWriteStream(fileName))

        this.generateHeaders(theOutput)

        // theOutput.moveDown()

        this.generateTable(theOutput)

        // this.generateFooter(theOutput)


        // write out file
        theOutput.end()

    }
}

module.exports = StockGenerator