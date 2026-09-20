import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Lock,
  Unlock,
  Eye,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Bookmark,
  Share2,
} from 'lucide-react';
import { UserProfile, DigitalBook, BookAccess } from '../../types';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../../services/dataService';

interface DigitalBooksSectionProps {
  currentUser: UserProfile;
  onPurchaseBook: (book: DigitalBook) => void;
}

export const DigitalBooksSection: React.FC<DigitalBooksSectionProps> = ({
  currentUser,
  onPurchaseBook,
}) => {
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [bookAccessList, setBookAccessList] = useState<BookAccess[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PAID' | 'UNLOCKED'>('ALL');

  // Reader Modal State
  const [readingBook, setReadingBook] = useState<DigitalBook | null>(null);

  // Admin Add / Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<DigitalBook | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    subject: 'UPSC Civil Services',
    classOrCategory: 'UPSC GS Prelims & Mains',
    price: 350,
    isFree: false,
    coverUrl: '',
    previewPdfUrl: '',
    description: '',
    totalPages: 120,
    allowDownload: false,
    isPublished: true,
  });

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  useEffect(() => {
    const unsubBooks = onSnapshot(collection(db, 'digitalBooks'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DigitalBook[];
      setBooks(list);
    });

    const unsubAccess = onSnapshot(collection(db, 'bookAccess'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BookAccess[];
      setBookAccessList(list);
    });

    return () => {
      unsubBooks();
      unsubAccess();
    };
  }, []);

  // Check if current student has purchased / unlocked a specific book
  const hasAccess = (book: DigitalBook): boolean => {
    if (book.isFree) return true;
    if (isAdmin) return true; // Admins have full preview rights
    const studentId = currentUser.studentId || currentUser.uid;
    return bookAccessList.some((ba) => ba.studentId === studentId && ba.bookId === book.id);
  };

  const subjects = ['ALL', ...Array.from(new Set(books.map((b) => b.subject)))];

  const filteredBooks = books.filter((b) => {
    // Non-admins only see published books
    if (!isAdmin && !b.isPublished) return false;

    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'ALL' || b.subject === selectedSubject;

    const unlocked = hasAccess(b);
    let matchesType = true;
    if (filterType === 'FREE') matchesType = b.isFree;
    else if (filterType === 'PAID') matchesType = !b.isFree;
    else if (filterType === 'UNLOCKED') matchesType = unlocked;

    return matchesSearch && matchesSubject && matchesType;
  });

  // Admin handlers
  const handleOpenAdd = () => {
    setEditingBook(null);
    setBookFormData({
      title: '',
      author: 'DARULFAHAM Academic Council',
      subject: 'UPSC Civil Services',
      classOrCategory: 'UPSC GS Prelims & Mains',
      price: 350,
      isFree: false,
      coverUrl: '',
      previewPdfUrl: '',
      description: '',
      totalPages: 140,
      allowDownload: false,
      isPublished: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (b: DigitalBook) => {
    setEditingBook(b);
    setBookFormData({
      title: b.title,
      author: b.author,
      subject: b.subject,
      classOrCategory: b.classOrCategory,
      price: b.price,
      isFree: b.isFree,
      coverUrl: b.coverUrl || '',
      previewPdfUrl: b.previewPdfUrl || '',
      description: b.description,
      totalPages: b.totalPages,
      allowDownload: b.allowDownload,
      isPublished: b.isPublished,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.title.trim()) return;

    if (editingBook) {
      await updateDoc(doc(db, 'digitalBooks', editingBook.id), {
        ...bookFormData,
        price: bookFormData.isFree ? 0 : Number(bookFormData.price),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newBook: Omit<DigitalBook, 'id'> = {
        ...bookFormData,
        price: bookFormData.isFree ? 0 : Number(bookFormData.price),
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'digitalBooks'), newBook);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the digital library?`)) {
      await deleteDoc(doc(db, 'digitalBooks', id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              DARULFAHAM Digital Library & Study Materials
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              E-Books & Modules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curated civil services compendiums, Islamic history research, ethics treatises, and test revision guides.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload / Add New E-Book</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search books by title, author, syllabus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'FREE', 'PAID', 'UNLOCKED'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type === 'ALL'
                  ? 'All Books'
                  : type === 'FREE'
                  ? 'Free Access'
                  : type === 'PAID'
                  ? 'Premium'
                  : 'My Unlocked'}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <Filter className="h-3 w-3" /> Subject:
          </span>
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                selectedSubject === sub
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Book Catalog Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-sm">No digital materials found</p>
          <p className="text-xs text-slate-400 mt-1">Try relaxing your search terms or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const unlocked = hasAccess(book);

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Book Card Header / Badge Banner */}
                  <div className="h-28 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white relative flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-indigo-200 backdrop-blur-xs">
                        {book.subject}
                      </span>
                      {book.isFree ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Free Read
                        </span>
                      ) : unlocked ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                          <Unlock className="h-3 w-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ₹{book.price}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-300 font-medium truncate">{book.classOrCategory}</p>
                    </div>
                  </div>

                  {/* Book Body */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">By {book.author}</p>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 font-mono">
                      <span>{book.totalPages} Pages</span>
                      <span>•</span>
                      <span>{book.allowDownload ? 'Downloadable PDF' : 'Online Reader Only'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  {unlocked ? (
                    <button
                      onClick={() => setReadingBook(book)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Open E-Reader</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onPurchaseBook(book)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Unlock with Cashfree (₹{book.price})</span>
                    </button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(book)}
                        title="Edit Book Details"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id, book.title)}
                        title="Delete Book"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
            {/* Reader Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white truncate max-w-md">{readingBook.title}</h4>
                  <p className="text-[11px] text-slate-400">By {readingBook.author} • {readingBook.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {readingBook.allowDownload && (
                  <button
                    onClick={() => alert(`Initiating secure encrypted download for: ${readingBook.title}.pdf`)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
                <button
                  onClick={() => setReadingBook(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Reader Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                    Chapter 1: Foundations & Analytical Overview
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{readingBook.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized Study Edition • DARULFAHAM Scholastic Press
                  </p>
                </div>

                <div className="prose prose-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    {readingBook.description}
                  </p>
                  <p>
                    This comprehensive treatise is designed specifically for competitive aspirants undergoing intensive preparation at DARULFAHAM Sanctum facilities. Each section combines primary conceptual tenets with historical case studies, constitutional precedents, and high-yield examination notes.
                  </p>
                  <div className="bg-slate-50 border-l-4 border-indigo-600 p-3 rounded-r-lg text-xs text-slate-800">
                    <p className="font-bold text-slate-900">Key Takeaway for Mains Examination:</p>
                    <p className="mt-1">
                      Always balance analytical critique with constructive policy solutions. Support every administrative recommendation with empirical data or established jurisprudence.
                    </p>
                  </div>
                  <p>
                    The complete syllabus matrix aligns directly with civil services standards, ensuring structured milestones from foundational concepts to advanced multi-disciplinary answer-writing syntheses.
                  </p>
                </div>
              </div>

              {/* Table of Contents Preview */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
                  Table of Contents & Module Structure
                </h5>
                <ul className="divide-y divide-slate-100 text-xs text-slate-600 space-y-1">
                  <li className="py-2 flex justify-between">
                    <span>1. Executive Summary & Epistemological Framework</span>
                    <span className="font-mono text-slate-400">pg 1-24</span>
                  </li>
                  <li className="py-2 flex justify-between">
                    <span>2. Structural Analysis & Comparative Frameworks</span>
                    <span className="font-mono text-slate-400">pg 25-68</span>
                  </li>
                  <li className="py-2 flex justify-between">
                    <span>3. High-Yield Question Bank & Solution Keys</span>
                    <span className="font-mono text-slate-400">pg 69-112</span>
                  </li>
                  <li className="py-2 flex justify-between">
                    <span>4. Appendix: Timeline & Legal Precedents</span>
                    <span className="font-mono text-slate-400">pg 113-{readingBook.totalPages}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Reader Footer */}
            <div className="bg-white border-t border-slate-200 p-3 flex items-center justify-between text-xs text-slate-500">
              <span>Reading mode: Protected Study Session</span>
              <button
                onClick={() => setReadingBook(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Book Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 text-slate-900 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingBook ? 'Edit E-Book Material' : 'Add New E-Book Material'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                  placeholder="e.g. Modern Indian History & National Movement"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Author / Publisher</label>
                  <input
                    type="text"
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={bookFormData.subject}
                    onChange={(e) => setBookFormData({ ...bookFormData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UPSC Civil Services">UPSC Civil Services</option>
                    <option value="General Studies">General Studies</option>
                    <option value="Islamic History & Culture">Islamic History & Culture</option>
                    <option value="Ethics & Governance">Ethics & Governance</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Class / Category</label>
                  <input
                    type="text"
                    value={bookFormData.classOrCategory}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, classOrCategory: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Pages</label>
                  <input
                    type="number"
                    value={bookFormData.totalPages}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, totalPages: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  placeholder="Summary of chapters and study points..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Access Model</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={bookFormData.isFree}
                        onChange={() => setBookFormData({ ...bookFormData, isFree: true, price: 0 })}
                      />
                      <span>Free for all</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!bookFormData.isFree}
                        onChange={() => setBookFormData({ ...bookFormData, isFree: false })}
                      />
                      <span>Paid / Premium</span>
                    </label>
                  </div>
                </div>

                {!bookFormData.isFree && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Price in INR (₹):</span>
                    <input
                      type="number"
                      min="1"
                      value={bookFormData.price}
                      onChange={(e) => setBookFormData({ ...bookFormData, price: Number(e.target.value) })}
                      className="w-28 px-3 py-1 text-right font-mono font-bold border border-slate-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={bookFormData.allowDownload}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, allowDownload: e.target.checked })
                    }
                  />
                  <span>Allow PDF download</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={bookFormData.isPublished}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, isPublished: e.target.checked })
                    }
                  />
                  <span>Publish immediately</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Save E-Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
