const fs = require('fs');

let ratesPage = fs.readFileSync('app/rates/page.tsx', 'utf8');
let lines = ratesPage.split(/\r?\n/);

const headerIndex = lines.findIndex(l => l.trim() === '{/* Header */}');
console.log('headerIndex:', headerIndex);

if (headerIndex !== -1) {
  const ratesModalJSX = `      {/* EXTENDED-VIEW RATES EDITOR MODAL */}
      <RatesEditorModal
        isOpen={showRatesEditorModal}
        onClose={() => setShowRatesEditorModal(false)}
        editingRateId={editingRateId}
        initialData={{
          carrier,
          por,
          pol,
          pod,
          fpod,
          d20,
          d20Type,
          h40,
          h40Type,
          freeTime,
          validDate,
          transitTime,
          routing,
          rateType,
          remarks,
        }}
        onSave={async (data) => {
          addMyRate({
            carrier: data.carrier,
            por: data.por,
            pol: data.pol,
            pod: data.pod,
            fpod: data.fpod,
            d20: Number(data.d20),
            d20Type: data.d20Type,
            h40: Number(data.h40),
            h40Type: data.h40Type,
            ft: data.freeTime,
            tt: data.transitTime,
            valid: data.validDate,
            rateType: data.rateType,
            route: data.routing,
            remark: data.remarks,
          });
          setEditingRateId(null);
          handleClearForm(false);
          setShowRatesEditorModal(false);
          toast('New custom i-Rate saved to workspace.');
        }}
        onUpdate={async (rateId, data) => {
          updateMyRate(rateId, {
            carrier: data.carrier,
            por: data.por,
            pol: data.pol,
            pod: data.pod,
            fpod: data.fpod,
            d20: Number(data.d20),
            d20Type: data.d20Type,
            h40: Number(data.h40),
            h40Type: data.h40Type,
            ft: data.freeTime,
            tt: data.transitTime,
            valid: data.validDate,
            rateType: data.rateType,
            route: data.routing,
            remark: data.remarks,
          });
          setEditingRateId(null);
          handleClearForm(false);
          setShowRatesEditorModal(false);
          toast(\`Rate \${rateId} updated successfully.\`);
        }}
        onDuplicate={async (data) => {
          addMyRate({
            carrier: data.carrier,
            por: data.por,
            pol: data.pol,
            pod: data.pod,
            fpod: data.fpod,
            d20: Number(data.d20),
            d20Type: data.d20Type,
            h40: Number(data.h40),
            h40Type: data.h40Type,
            ft: data.freeTime,
            tt: data.transitTime,
            valid: data.validDate,
            rateType: data.rateType,
            route: data.routing,
            remark: data.remarks,
          });
          setEditingRateId(null);
          handleClearForm(false);
          setShowRatesEditorModal(false);
          toast('Rate duplicated and saved as new distinct i-Rate.');
        }}
      />
`;

  lines.splice(headerIndex, 0, ratesModalJSX);
  fs.writeFileSync('app/rates/page.tsx', lines.join('\n'), 'utf8');
  console.log('Inserted RatesEditorModal into app/rates/page.tsx successfully.');
} else {
  console.error('Could not find {/* Header */}');
}
