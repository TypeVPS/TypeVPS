import fs from "fs";
import PDFDocument from "pdfkit";
import { ENV } from "./env";

interface InvoiceItem {
	name: string;
	description: string;
	quantity: number;
	price: number;
	tax: number;
}

interface Entity {
	company: string;
	address: string;
	zip: string;
	city: string;
	country: string;
	email: string;
	phone: string;
}

interface Invoice {
	from: Entity;
	to: Entity;
	items: InvoiceItem[];
	invoice_nr: string;
	subtotal: number;
}

export function createInvoice(invoice: Invoice) {
	const MARGIN = 50;
	const doc = new PDFDocument({ size: "A4", margin: MARGIN });

	// header
	// left company info
	const x = MARGIN;
	let y = 57;
	const baseGap = 15;

	doc.font("Helvetica");

	const Y = (x: number) => y + x * baseGap;

	const entity = (entity: Entity, lr: "left" | "right") => {
		doc

			.fontSize(20)
			.text(entity.company, x, y, { align: lr })
			.fontSize(10)
			.text(entity.address, x, Y(2), { align: lr })
			.text(entity.email, x, Y(3), { align: lr })
			.text(entity.phone, x, Y(4), { align: lr })
			.moveDown();
	};

	entity(invoice.from, "left");
	y = 57;
	entity(invoice.to, "right");

	y = 150;
	doc
		.fontSize(20)
		.text("Invoice", x, y, { align: "right" })
		.fontSize(10)
		.text(invoice.invoice_nr, x, Y(2), { align: "right" })
		.text(`Date: ${new Date().toLocaleDateString()}`, x, Y(3), {
			align: "right",
		})
		.text(`Due: ${new Date().toLocaleDateString()}`, x, Y(4), {
			align: "right",
		});

	// create table of items
	y = 250;
	doc.font("Helvetica-Bold");
	doc.text("Item", x, y);
	doc.text("Description", x + 150, y);
	doc.text("Quantity", x + 300, y);
	doc.text("Price", x + 350, y);
	doc.text("Tax", x + 400, y);
	doc.text("Total", x, y, {
		align: "right",
	});
	y += 12;

	doc.font("Helvetica");
	for (const item of invoice.items) {
		doc.text(item.name, x, y);
		doc.text(item.description, x + 150, y);
		doc.text(item.quantity.toString(), x + 300, y);
		doc.text(`${item.price.toString()} ${ENV.CURRENCY}`, x + 350, y);
		doc.text(`${item.tax}%`, x + 400, y);
		doc.text(item.quantity.toString(), x, y, {
			align: "right",
		});
		y += 12;
	}

	doc.end();
	doc.pipe(fs.createWriteStream("invoice.pdf"));
}
