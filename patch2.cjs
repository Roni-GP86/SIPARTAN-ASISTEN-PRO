const fs = require('fs');
let content = fs.readFileSync('src/components/RuangMuridView.tsx', 'utf8');

const oldInputs = `              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Roni Bhidju"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NISN Siswa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value)}
                      placeholder="Contoh: 0012345678"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>`;

const newInputs = `              <div className="space-y-4">
                {studentList.length > 0 ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Pilih Kartu Nama Anda <span className="text-red-500">*</span>
                    </label>
                    {selectedStudent ? (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-extrabold text-blue-900 text-sm">{selectedStudent.nama}</p>
                          <p className="text-xs text-blue-700 font-medium">NISN: {selectedStudent.nisn}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(null);
                            setStudentName('');
                            setStudentNisn('');
                          }}
                          className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100"
                        >
                          Ganti Nama
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                        {studentList.map(stu => (
                          <button
                            key={stu.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(stu);
                              setStudentName(stu.nama);
                              setStudentNisn(stu.nisn);
                            }}
                            className="flex flex-col text-left p-3 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all focus:outline-none"
                          >
                            <span className="font-bold text-slate-800 text-sm">{stu.nama}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">NISN: {stu.nisn}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Siswa <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Contoh: Roni Bhidju"
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          NISN Siswa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={studentNisn}
                          onChange={(e) => setStudentNisn(e.target.value)}
                          placeholder="Contoh: 0012345678"
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kelas
                        </label>
                        <input
                          type="text"
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 bg-slate-50"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>`;

content = content.replace(oldInputs, newInputs);
fs.writeFileSync('src/components/RuangMuridView.tsx', content);
