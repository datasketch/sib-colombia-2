const ColorLabel = ({ backgroundColor, label }) => {
  return (
    <div className='flex flex-row gap-1 items-center'>
      <div className={`rounded-full w-3 h-3 ${backgroundColor}`} />
      <b>{label}</b>
    </div>
  )
}

export default ColorLabel
