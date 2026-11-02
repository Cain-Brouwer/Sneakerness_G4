import Link from 'next/link';

export default function CreateButton() {
    return (
        <div className="pb-2 flex justify-end items-center">
            <Link
                href="/contactpersonen/nieuw"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded transition-colors">
                <p>Voeg een contactpersoon toe</p>
            </Link>
        </div>
    )
}