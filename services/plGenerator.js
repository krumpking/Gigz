const PDFGenerator = require('pdfkit')
const fs = require('fs')

class PLGenerator {
    constructor(q) {
        this.q = q
    }

    generateHeaders(doc) {

        let today = new Date();
        let now = today.getDate() + " " + this.showMonth(today.getMonth() + 1) + " " + today.getFullYear();
        let monthToDate = new Date(today.setDate(today.getDate() - 30));
        let monthToDateInReadableFormat = monthToDate.getDate() + " " + this.showMonth(monthToDate.getMonth() + 1) + " " + monthToDate.getFullYear();

        const rectXOffset = 25;
        const rectYOffset = 25;
        let rectPosition = 25;

        doc.image('./media/logo.jpg', doc.page.width - 100, 0, { width: 50, height: 50, fit: [40, 40], align: 'center', valign: 'center' })


        doc.rect(0, 0, doc.page.width - 150, 60).fill("#063970")
        doc
            .fillColor("#fff")
            .fontSize(10)
            .text(`Generated for ${this.q.no.substring(0, this.q.no.indexOf("@c.us"))}`, 20, 10)
        doc
            .fillColor("#fff")
            .fontSize(15)
            .text(`Financial Statement`, 20, 30, { align: 'left' })
        doc
            .fillColor("#fff")
            .fontSize(8)
            .text(`${monthToDateInReadableFormat}  to ${now}`, 20, 50)

        doc.rect(doc.page.width - 150, 40, doc.page.width, 20).fill("#154c79")
        doc
            .fillColor("#fff")
            .fontSize(15)
            .text(`${today.getFullYear()}`, doc.page.width - 130, 45, { align: 'center' })
        doc.rect(0, 60, doc.page.width - 150, 20).fill("#ddd") // Left side
        doc.rect(doc.page.width - 150, 60, doc.page.width, 20).fill("#427ef5") // Right had side
        doc
            .fillColor("#fff")
            .fontSize(15)
            .text(`${this.showMonth(today.getMonth() + 1)}`, doc.page.width - 130, 65, { align: 'center' })

    }

    generateTable(doc) {
        const tableTop = 80
        const itemCodeX = 50
        const descriptionX = 30
        const quantityX = 250
        const priceX = 370
        const amountX = 480








        let i = 0;
        let yIncome = 0;

        doc.rect(0, tableTop, doc.page.width - 150, 20).fill("#42f5bc")
        doc.rect(doc.page.width - 148, tableTop, doc.page.width, 20).fill("#42f5bc")
        // Revenue
        doc
            .fill("#000")
            .fontSize(15)
            .text('Revenue', descriptionX, tableTop + 5)
            .text(`USD`, priceX, tableTop + 5)
            .text(`${this.q.salesTotal + this.q.otherIncomeTotal}`, amountX, tableTop + 5)


        doc.rect(0, tableTop + 20, doc.page.width - 150, 50).fill("#90f5d5")

        doc.rect(doc.page.width - 148, tableTop + 20, doc.page.width, 50).fill("#90f5d5")



        yIncome = tableTop + 25
        doc
            .fill("#000")
            .fontSize(10)
            .text("Sales ", descriptionX, yIncome)
            .text(`USD`, priceX, yIncome)
            .text(`${this.q.salesTotal}`, amountX, yIncome)

        doc
            .fill("#000")
            .fontSize(10)
            .text("Other income", descriptionX, yIncome + 25)
            .text(`USD`, priceX, yIncome + 25)
            .text(`${this.q.otherIncomeTotal}`, amountX, yIncome + 25)





        let cogs = this.q.cogs
        const gross = (this.q.salesTotal + this.q.otherIncomeTotal) - cogs

        //
        const cogsTop = yIncome + 40;

        doc.rect(0, cogsTop, doc.page.width - 150, 20).fill("#f5276c")
        doc.rect(doc.page.width - 148, cogsTop, doc.page.width, 20).fill("#f5276c")

        doc
            .fill("#000")
            .fontSize(15)
            .text('COGS', descriptionX, cogsTop + 5)
            .text(`USD`, priceX, cogsTop + 5)
            .text(`${cogs}`, amountX, cogsTop + 5)


        doc.moveTo(doc.page.width - 148, cogsTop + 20)
            .lineTo(doc.page.width, cogsTop + 20)
            .stroke()

        doc
            .fontSize(15)
            .text('Gross Profit', descriptionX, cogsTop + 25)
            .text(`USD`, priceX, cogsTop + 25)
            .text(`${gross}`, amountX, cogsTop + 25)







        // Operating Costs
        const operatingTop = cogsTop + 60;

        const operatingCostsTotal = this.q.salaries + this.q.rentals + this.q.utilities + this.q.transport + this.q.supplies + this.q.otherExpenses;

        doc.rect(0, operatingTop, doc.page.width - 150, 20).fill("#439cf0")
        doc.rect(doc.page.width - 148, operatingTop, doc.page.width, 20).fill("#439cf0")

        doc
            .fill("#000")
            .fontSize(15)
            .text('SG&A', descriptionX, operatingTop + 5)
            .text(`USD`, priceX, operatingTop + 5)
            .text(`${operatingCostsTotal}`, amountX, operatingTop + 5)



        let expense = this.q.expenses
        let j = 0
        let yOperatingCosts = 0;


        doc.rect(0, operatingTop + 20, doc.page.width - 150, 150).fill("#7db5f5")

        doc.rect(doc.page.width - 148, operatingTop + 20, doc.page.width, 150).fill("#7db5f5")


        yOperatingCosts = operatingTop + 25;

        doc
            .fill("#000")
            .fontSize(10)
            .text("Salaries", descriptionX, yOperatingCosts)
            .text(`USD`, priceX, yOperatingCosts)
            .text(`${this.q.salaries}`, amountX, yOperatingCosts)

        doc
            .fill("#000")
            .fontSize(10)
            .text("Rentals and Outgoings", descriptionX, yOperatingCosts + 25)
            .text(`USD`, priceX, yOperatingCosts + 25)
            .text(`${this.q.rentals}`, amountX, yOperatingCosts + 25)

        doc
            .fill("#000")
            .fontSize(10)
            .text("Utilities including Internet & telephone", descriptionX, yOperatingCosts + 50)
            .text(`USD`, priceX, yOperatingCosts + 50)
            .text(`${this.q.utilities}`, amountX, yOperatingCosts + 50)

        doc
            .fill("#000")
            .fontSize(10)
            .text("Transport & logistics", descriptionX, yOperatingCosts + 75)
            .text(`USD`, priceX, yOperatingCosts + 75)
            .text(`${this.q.transport}`, amountX, yOperatingCosts + 75)

        doc
            .fill("#000")
            .fontSize(10)
            .text("Office supplies", descriptionX, yOperatingCosts + 100)
            .text(`USD`, priceX, yOperatingCosts + 100)
            .text(`${this.q.supplies}`, amountX, yOperatingCosts + 100)


        doc
            .fill("#000")
            .fontSize(10)
            .text("Other expenses", descriptionX, yOperatingCosts + 125)
            .text(`USD`, priceX, yOperatingCosts + 125)
            .text(`${this.q.otherExpenses}`, amountX, yOperatingCosts + 125)

        doc.moveTo(doc.page.width - 148, yOperatingCosts + 145)
            .lineTo(doc.page.width, yOperatingCosts + 145)
            .stroke()

        doc.moveTo(doc.page.width - 148, yOperatingCosts + 147)
            .lineTo(doc.page.width, yOperatingCosts + 147)
            .stroke()
        // EBT
        doc
            .fill("#000")
            .fontSize(15)
            .text("EBITDA", descriptionX, yOperatingCosts + 155)
            .text(`USD`, priceX, yOperatingCosts + 155)
            .text(`${gross - operatingCostsTotal}`, amountX, yOperatingCosts + 155)



    }

    generateFooter(doc) {


        doc
            .fontSize(10)
            .text(`Payment due upon receipt. `, 50, 700, {
                align: 'center'
            })
    }


    showMonth(number) {

        switch (number) {
            case 1:
                return "January";
            case 2:
                return "February";
            case 3:
                return "March";
            case 4:
                return "April";
            case 5:
                return "May";
            case 6:
                return "June";
            case 7:
                return "July";
            case 8:
                return "August";
            case 9:
                return "September";
            case 10:
                return "October";
            case 11:
                return "November";
            case 12:
                return "December";
            default:
                break;
        }
    }

    generate() {
        let theOutput = new PDFGenerator('A4')

        const fileName = `${this.q.name}.pdf`

        // pipe to a writable stream which would save the result into the same directory
        theOutput.pipe(fs.createWriteStream(fileName))



        this.generateHeaders(theOutput)

        // theOutput.moveDown()

        this.generateTable(theOutput, false, 0, false, 0)

        // this.generateFooter(theOutput)


        // write out file
        theOutput.end()

    }
}

module.exports = PLGenerator