/* import publishers from '../public/data/publicador.json' */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as TooltipPieChart, Legend } from 'recharts'
import { formatNumbers } from './lib/functions'

export default function InfoPublishers ({ total, data, region, router }) {
  const totalPublishers = total.length

  // Handle new data structure
  let nTypeInternational = 0
  let totalPublishersNational = 0
  let infoRegion = []
  let infoRemark = []

  if (data && data.tipo_organizacion) {
    // New structure: data.stats.tipo_organizacion array
    const tipoOrganizacionData = data.tipo_organizacion || []
    const registrosData = data.registros_tipo_organizacion || []

    const internationalPublisher = tipoOrganizacionData.find(item => item.tipo_organizacion === 'Internacional')
    nTypeInternational = internationalPublisher ? internationalPublisher.n : 0

    totalPublishersNational = tipoOrganizacionData.reduce((total, obj) => {
      if (obj.tipo_organizacion !== 'Internacional') {
        return total + obj.n
      } else {
        return total
      }
    }, 0)

    // Filter out "No definido" / null / empty categories — prod hides them.
    const isReal = (item) => {
      const name = item.tipo_organizacion
      return name && name !== 'No definido'
    }
    const tipoFiltered = tipoOrganizacionData.filter(isReal)
    const registrosFiltered = registrosData.filter(isReal)

    // Calculate percentages for pie charts
    const totalPublishersForPct = tipoFiltered.reduce((sum, item) => sum + item.n, 0)

    infoRegion = tipoFiltered.map(item => ({
      name: item.tipo_organizacion,
      value: totalPublishersForPct > 0 ? (item.n / totalPublishersForPct) * 100 : 0,
      label: item.n
    }))

    const totalRegistros = registrosFiltered.reduce((sum, item) => sum + item.registros, 0)

    infoRemark = registrosFiltered.map(item => ({
      name: item.tipo_organizacion,
      value: totalRegistros > 0 ? (item.registros / totalRegistros) * 100 : 0,
      label: item.registros
    }))
  } else {
    // Fallback for old structure or no data
    const internationalPublisher = data?.find?.(item => item.tipo_organizacion === 'Internacional')
    nTypeInternational = internationalPublisher ? internationalPublisher.n_tipo : 0

    totalPublishersNational = data?.reduce?.((total, obj) => {
      if (obj.tipo_organizacion !== 'Internacional') {
        return total + obj.n_tipo
      } else {
        return total
      }
    }, 0) || 0

    infoRegion = data?.map?.(item => ({
      name: item.tipo_organizacion,
      value: item.pct_tipo * 100,
      label: item.n_tipo
    })) || []

    infoRemark = data?.map?.(item => ({
      name: item.tipo_organizacion,
      value: item.pct_tipo_obs * 100,
      label: item.n_tipo_obs
    })) || []
  }

  const COLORS = ['#5151F2', '#00AFFF', '#4AD3AC', '#F26330', '#FFD150', '#FFE0BB', '#163875', '#161B33']

  /* const place = region.label

  const counts = {
    type: {},
    region: {},
    remarks: {}
  }

  for (let i = 0; i < publishers.length; i++) {
    const obj = publishers[i]
    const type = obj.tipo_organizacion

    if (type !== undefined) {
      const regions = obj.region?.split(', ')
      for (let j = 0; j < regions?.length; j++) {
        const region = regions[j]

        if (!counts.type[type]) {
          counts.type[type] = {}
        }
        counts.type[type][region] = (counts.type[type][region] || 0) + 1

        if (!counts.region[region]) {
          counts.region[region] = {}
        }
        counts.region[region][type] = (counts.region[region][type] || 0) + 1

        if (!counts.remarks[region]) {
          counts.remarks[region] = {}
        }

        counts.remarks[region][type] = (counts.remarks[region][type] || 0) + obj.registros
      }
    }
  }

  const regionCounts = counts.region[place]
  const regionCountsArray = []

  for (const type in regionCounts) {
    const typeOrgRegion = {
      name: type,
      value: regionCounts[type]
    }
    regionCountsArray.push(typeOrgRegion)
  }

  const infoRegion = regionCountsArray.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

  const remarksCounts = counts.remarks[place]
  const remarksCountsArray = []

  for (const type in remarksCounts) {
    const typeOrgRemarks = {
      name: type,
      value: remarksCounts[type]
    }
    remarksCountsArray.push(typeOrgRemarks)
  }

  const infoRemark = remarksCountsArray.sort((a, b) => {
    return a.name.localeCompare(b.name)
  }) */

  /* const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.7
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  } */

  const renderLegend = (props) => {
    const { payload } = props
    return (
      <ul className='flex flex-wrap justify-center gap-x-4 gap-y-1 px-2 pt-2 text-sm leading-tight'>
        {
          payload.map((entry, index) => (
            <li key={`item-${index}`} className='flex items-center gap-1.5'>
              <span style={{ color: entry.color, fontSize: '20px', lineHeight: 0 }}>
                {'\u25CF'}
              </span>
              <span>{entry.value}</span>
            </li>
          ))
        }
      </ul>
    )
  }

  const CustomTooltipTypeOrg = (props) => {
    const { active, payload } = props
    if (active && payload && payload.length) {
      const { name } = payload[0].payload
      const { label } = payload[0].payload
      return (
        <div className="bg-white p-1.5 rounded shadow-lg w-3/3">
          {/* Tipo de organización: Internacional, cantidad de publicadores: 63 (60%) */}
          <p className="label text-xs font-semibold italic">Tipo de organización: <span className='text-xs font-normal not-italic'>{`${name}`}</span></p>
          {/* <p className="text-xs">{`Porcentaje de publicador: ${payload[0].value.toFixed(0)}%`}</p> */}
          <p className='text-xs font-semibold italic'>Cantidad de publicadores: <span className='text-xs font-normal not-italic'>{`${formatNumbers(label)} (${payload[0].value.toFixed(0)}%)`}</span></p>
        </div>
      )
    }

    return null
  }

  const CustomTooltipObsTypeOrg = (props) => {
    const { active, payload } = props
    if (active && payload && payload.length) {
      const { name } = payload[0].payload
      const { label } = payload[0].payload
      return (
        <div className="bg-white p-1.5 rounded shadow-lg w-2/3">
          <p className="text-xs font-semibold italic">Tipo de organización: <span className='text-xs font-normal not-italic'>{`${name}`}</span></p>
          {/* <p className="text-xs">{`Porcentaje de publicador: ${payload[0].value.toFixed(0)}%`}</p> */}
          <p className='text-xs font-semibold italic'>Cantidad de observaciones: <span className='text-xs font-normal not-italic'>{`${formatNumbers(label)} (${payload[0].value.toFixed(0)}%)`}</span></p>
        </div>
      )
    }

    return null
  }

  return (
    <div className={`${router === '/mas/publicadores' ? 'flex flex-col md:flex-row gap-3 mt-10' : 'flex flex-col md:flex-row gap-5'} `}>
      <div className={`${router === '/mas/publicadores' ? 'bg-white flex flex-col text-black-2 p-2 shadow-default hover:shadow-select w-full md:w-[280px] min-h-[420px]' : 'bg-white flex flex-col text-black-2 py-6 px-7 shadow-default hover:shadow-select w-full md:w-[500px] min-h-[420px]'} `}>
        <h2 className="text-xl font-bold">Total de publicadores</h2>
        <div className='w-full mt-4 flex flex-col justify-center items-center'>
          <div className="w-full flex flex-col justify-center items-center h-full space-y-5">
            <div className='pt-2 w-full bg-gray-2 flex flex-col justify-center items-center'>
              <p className="text-black font-black text-3xl">{totalPublishersNational}</p>
              <p className="text-black text-xl">Nacionales</p>
            </div>
            {/* <div className='bg-dartmouth-green/20 w-20 h-[1px]' /> */}
            <div className='pt-2 flex flex-col justify-center items-center'>
              <p className="font-black text-3xl">{nTypeInternational}</p>
              <p className="text-xl">Internacionales</p>
            </div>
            <div className='w-full bg-gray-2 px-3 flex justify-end items-center'>
              <h3 className='text-lg italic'>Total: {totalPublishers}</h3>
            </div>
          </div>
          {/* <p className="text-xl">{totalPublishers} Publicadores en total</p> */}
        </div>
      </div>

      <div className={`${router === '/mas/publicadores' ? 'bg-white flex flex-col text-black-2 p-2 shadow-default hover:shadow-select w-full md:w-[521px] min-h-[420px]' : 'bg-white flex flex-col justify-between text-black-2 py-3 px-4 gap-y-2 shadow-default hover:shadow-select w-full md:w-[521px] min-h-[420px]'} `}>
        <h2 className="text-xl font-bold">Publicadores por tipo de organización</h2>
        <div className="h-[320px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={200} height={200} className='left-0'>
            <Pie
              data={infoRegion}
              cx="50%"
              cy="50%"
              labelLine={false}
              /* label={renderCustomizedLabel} */
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              className='text-xs'
            >
              {infoRegion.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <TooltipPieChart content={<CustomTooltipTypeOrg />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className={`${router === '/mas/publicadores' ? 'bg-white flex flex-col text-black-2 p-2 shadow-default hover:shadow-select w-full md:w-[521px] min-h-[420px]' : 'bg-white flex flex-col justify-between text-black-2 py-3 px-4 gap-y-2 shadow-default hover:shadow-select w-full md:w-[521px] min-h-[420px]'} `}>
        <h2 className="text-xl font-bold">Observaciones aportadas por tipo de organización</h2>
        <div className="h-[320px] mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart width={200} height={300} className='left-0'>
            <Pie
              data={infoRemark}
              cx="50%"
              cy="50%"
              labelLine={false}
              /* label={renderCustomizedLabel} */
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              className='text-xs'
            >
              {infoRemark.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <TooltipPieChart content={<CustomTooltipObsTypeOrg />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
