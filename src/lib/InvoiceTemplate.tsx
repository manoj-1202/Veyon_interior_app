export const InvoiceTemplate = ({ invoice }: any) => {
  return (
    <div id="invoice-root" style={styles.page}>

      {/* WATERMARK */}
      <div style={styles.watermark}>
        {invoice.status || "PAID"}
      </div>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.companyBox}>
          <img src="/logo.png" alt="logo" style={styles.logo} />
          <h1 style={styles.companyName}>{invoice.company.name}</h1>
          <p>{invoice.company.address}</p>
          <p>GSTIN: {invoice.company.gstin}</p>
          <p>{invoice.company.phone} | {invoice.company.email}</p>
        </div>

        <div style={styles.invoiceBox}>
          <h2 style={styles.invoiceTitle}>INVOICE</h2>
          <p><b>No:</b> {invoice.invoiceNumber}</p>
          <p><b>Date:</b> {invoice.date}</p>
          <p><b>Due:</b> {invoice.dueDate}</p>
        </div>
      </div>

      {/* BILL TO */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Bill To</h3>
        <p><b>{invoice.client.name}</b></p>
        <p>{invoice.client.address}</p>
        <p>GSTIN: {invoice.client.gstin}</p>
        <p>{invoice.client.phone}</p>
      </div>

      {/* TABLE */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Tax %</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {invoice.items.map((item: any, i: number) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.name}</td>
              <td>{item.hsn}</td>
              <td>{item.qty}</td>
              <td>₹{item.price.toFixed(2)}</td>
              <td>{item.tax}%</td>
              <td style={styles.amountCell}>
                ₹{item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS + BANK */}
      <div style={styles.totalsWrapper}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Bank Details</h3>
          <p><b>Bank:</b> {invoice.bank.name}</p>
          <p><b>Account:</b> {invoice.bank.accountName}</p>
          <p><b>Acc No:</b> {invoice.bank.accountNumber}</p>
          <p><b>IFSC:</b> {invoice.bank.ifsc}</p>

          <div style={styles.qrBox}>
            <p><b>Scan to Pay</b></p>
            <img src="/upi-qr.png" alt="QR" style={{ width: 90 }} />
          </div>
        </div>

        <div style={styles.totalBox}>
          <p>Subtotal: ₹{invoice.subtotal.toFixed(2)}</p>
          <p>Tax: ₹{invoice.taxAmount.toFixed(2)}</p>
          <div style={styles.grandTotal}>
            ₹{invoice.total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        <div style={{ width: "60%" }}>
          <h4>Terms & Conditions</h4>
          {invoice.terms?.split("\n").map((line: string, i: number) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div style={styles.signatureBox}>
          <p>For {invoice.company.name}</p>
          <div style={styles.signatureLine}></div>
          <p>Authorized Signature</p>
        </div>
      </div>

      {/* PAGE 2 */}
      <div style={{ pageBreakBefore: "always" }}>
        <h2>Legal Disclaimer</h2>
        {invoice.disclaimer?.split("\n").map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  )
}
const styles: any = {
  page: {
    width: "210mm",
    minHeight: "297mm",
    padding: "25mm",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#1f2933",
    backgroundColor: "#ffffff",
    position: "relative"
  },

  watermark: {
    position: "absolute",
    top: "45%",
    left: "25%",
    fontSize: "90px",
    fontWeight: "bold",
    color: "#000",
    opacity: 0.04,
    transform: "rotate(-30deg)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: 20,
    marginBottom: 25,
    borderBottom: "3px solid #0f172a"
  },

  companyBox: {
    maxWidth: "60%"
  },

  logo: {
    width: 70,
    marginBottom: 10
  },

  companyName: {
    margin: 0,
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 1
  },

  invoiceBox: {
    textAlign: "right",
    background: "#0f172a",
    color: "#fff",
    padding: 15,
    borderRadius: 6,
    minWidth: 180
  },

  invoiceTitle: {
    margin: 0,
    letterSpacing: 2
  },

  sectionTitle: {
    marginBottom: 8,
    color: "#0f172a"
  },

  card: {
    background: "#f8fafc",
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    border: "1px solid #e5e7eb"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 20
  },

  amountCell: {
    fontWeight: "bold"
  },

  totalsWrapper: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 25
  },

  qrBox: {
    marginTop: 15,
    textAlign: "center"
  },

  totalBox: {
    width: "35%",
    background: "#0f172a",
    color: "#fff",
    padding: 20,
    borderRadius: 8,
    textAlign: "right"
  },

  grandTotal: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
    letterSpacing: 1
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb"
  },

  signatureBox: {
    textAlign: "center",
    width: 200
  },

  signatureLine: {
    marginTop: 40,
    borderBottom: "2px solid #000"
  }
}
