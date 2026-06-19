// Highlighted entities — rendered in bold in the ranking tables to
// match the legacy "destacados" treatment. Match by label so the rule
// applies whether `region === 'Colombia'` (departments listed) or
// region is a department (municipalities listed).
const HIGHLIGHTED_LABELS = new Set([
  // Highlighted departments shown on /colombia
  'Boyacá', 'Nariño', 'Santander', 'Tolima',
])

export default function GraphsTopMun ({ data, region }) {
  const dataEndemicas = data.n_muni_mas_endemicas
  const dataAmenazadasNal = data.n_muni_mas_amenazadas_nacional

  const maxValueE = dataEndemicas ? Math.max(...dataEndemicas.map(obj => obj.n)) : 'En proceso...'
  const maxValueA = dataAmenazadasNal ? Math.max(...dataAmenazadasNal.map(obj => obj.n)) : 'En proceso...'

  const getDivStyles = (category, obj) => {
    const percentage = category === 'endemicas' ? Math.round((obj.n / maxValueE) * 100) : Math.round((obj.n / maxValueA) * 100)

    return {
      background: category === 'endemicas' ? '#5151F2' : '#F26330',
      width: `${percentage}px`,
      height: '12px',
      marginBottom: '5px',
      rowGap: '0.25rem',
      borderRadius: '9999px'
    }
  }

  const rowClass = (label) =>
    HIGHLIGHTED_LABELS.has(label) ? 'font-bold' : ''

  return (
    <>
      <div className="flex flex-col items-center gap-y-8 lg:flex-row lg:justify-center lg:gap-[235px]">
        {/* Table of endemic species */}
        <table>
          <thead>
            <tr className="border-b border-black/50">
              {
                region === 'Colombia' ? <th className="text-left">Departamento</th> : <th className="text-left">Municipio</th>
              }
              <th className="text-left">Núm. de especies endémicas</th>
            </tr>
          </thead>
          {
            dataEndemicas && Array.isArray(dataEndemicas) && dataEndemicas.length > 0
              ? dataEndemicas.map(obj => (
                <tbody key={obj.label}>
                  <tr className={rowClass(obj.label)}>
                    <td className="w-2/4">{obj.label}</td>
                    <td className="flex flex-row items-center justify-start gap-x-3 w-3/4">
                      <span key={obj.label} style={getDivStyles('endemicas', obj)} />
                      <span>{obj.n}</span>
                    </td>
                  </tr>
                </tbody>
              ))
              : <div>En proceso...</div>
          }
        </table>

        {/* National endangered species table */}
        <table>
          <thead>
            <tr className="border-b border-black/50">
              {
                region === 'Colombia' ? <th className="text-left">Departamento</th> : <th className="text-left">Municipio</th>
              }
              <th className="text-left">Núm. de especies amenazadas (nacional)</th>
            </tr>
          </thead>
          {
            dataAmenazadasNal && Array.isArray(dataAmenazadasNal) && dataAmenazadasNal.length > 0
              ? dataAmenazadasNal.map(obj => (
                <tbody key={obj.label}>
                  <tr className={rowClass(obj.label)}>
                    <td className="w-2/4">{obj.label}</td>
                    <td className="flex flex-row items-center justify-start gap-x-3 w-3/4">
                      <span key={obj.label} style={getDivStyles('amenazadas', obj)} />
                      <span>{obj.n}</span>
                    </td>
                  </tr>
                </tbody>
              ))
              : <div>En proceso...</div>
          }
        </table>
      </div>
    </>
  )
}
