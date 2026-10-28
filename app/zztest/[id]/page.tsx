export default async function P({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <p>ok {id}</p>; }
