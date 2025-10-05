```vue
<template>
  <div class="container mt-5">
    <h2>Проекты и дефекты</h2>

    <!-- Форма создания проекта -->
    <h3>Создать проект</h3>
    <form @submit.prevent="createProject">
      <div class="mb-3">
        <label for="projectName" class="form-label">Название проекта</label>
        <input
          type="text"
          class="form-control"
          id="projectName"
          v-model.trim="projectName"
          placeholder="Введите название проекта"
          required
        />
      </div>
      <div class="mb-3">
        <label for="projectDescription" class="form-label">Описание проекта</label>
        <textarea
          class="form-control"
          id="projectDescription"
          v-model.trim="projectDescription"
          placeholder="Введите описание проекта (опционально)"
        ></textarea>
      </div>
      <div class="mb-3">
        <label for="projectStatus" class="form-label">Статус</label>
        <select
          class="form-control"
          id="projectStatus"
          v-model="projectStatus"
          required
        >
          <option value="open">Открыт</option>
          <option value="in progress">В процессе</option>
          <option value="closed">Закрыт</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary mb-4">Создать проект</button>
    </form>

    <!-- Форма редактирования проекта -->
    <div v-if="editingProject">
      <h3>Редактировать проект #{{ editingProject.id }}</h3>
      <form @submit.prevent="updateProject">
        <div class="mb-3">
          <label for="editProjectName" class="form-label">Название проекта</label>
          <input
            type="text"
            class="form-control"
            id="editProjectName"
            v-model.trim="editProjectName"
            placeholder="Введите название проекта"
            required
          />
        </div>
        <div class="mb-3">
          <label for="editProjectDescription" class="form-label">Описание проекта</label>
          <textarea
            class="form-control"
            id="editProjectDescription"
            v-model.trim="editProjectDescription"
            placeholder="Введите описание проекта (опционально)"
          ></textarea>
        </div>
        <div class="mb-3">
          <label for="editProjectStatus" class="form-label">Статус</label>
          <select
            class="form-control"
            id="editProjectStatus"
            v-model="editProjectStatus"
            required
          >
            <option value="open">Открыт</option>
            <option value="in progress">В процессе</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="editClosedAt" class="form-label">Дата закрытия</label>
          <input
            type="date"
            class="form-control"
            id="editClosedAt"
            v-model="editClosedAt"
          />
        </div>
        <button type="submit" class="btn btn-success mb-4">Сохранить</button>
        <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditProject">Отмена</button>
      </form>
    </div>

    <!-- Кнопки экспорта проектов -->
    <div v-if="projects.length > 0" class="mb-4">
      <button class="btn btn-info me-2" @click="exportProjects('csv')">Экспорт проектов в CSV</button>
      <button class="btn btn-info" @click="exportProjects('excel')">Экспорт проектов в Excel</button>
    </div>

    <!-- Список проектов -->
    <h3>Ваши проекты</h3>
    <div v-if="projects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Статус</th>
            <th>Создан</th>
            <th>Закрыт</th>
            <th>Создал</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in projects" :key="project.id">
            <td>{{ project.name }}</td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ project.status }}</td>
            <td>{{ new Date(project.createdAt).toLocaleDateString() }}</td>
            <td>{{ project.closedAt ? new Date(project.closedAt).toLocaleDateString() : '-' }}</td>
            <td>{{ project.createdBy || '-' }}</td>
            <td>
              <button class="btn btn-sm btn-primary me-2" @click="selectProject(project.id)">Просмотреть дефекты</button>
              <button class="btn btn-sm btn-warning me-2" @click="startEditProject(project)">Редактировать</button>
              <button class="btn btn-sm btn-danger" @click="deleteProject(project.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>У вас пока нет проектов.</p>
    </div>

    <!-- Форма создания дефекта -->
    <div v-if="selectedProjectId !== null">
      <h3>Добавить дефект для проекта #{{ selectedProjectId }}</h3>
      <form @submit.prevent="createDefect">
        <div class="mb-3">
          <label for="defectDescription" class="form-label">Описание дефекта</label>
          <textarea
            class="form-control"
            id="defectDescription"
            v-model.trim="defectDescription"
            placeholder="Введите описание дефекта"
            required
          ></textarea>
        </div>
        <div class="mb-3">
          <label for="defectPriority" class="form-label">Приоритет</label>
          <select
            class="form-control"
            id="defectPriority"
            v-model="defectPriority"
            required
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="defectStatus" class="form-label">Статус</label>
          <select
            class="form-control"
            id="defectStatus"
            v-model="defectStatus"
            required
          >
            <option value="open">Открыт</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="defectAssignee" class="form-label">Исполнитель</label>
          <select
            class="form-control"
            id="defectAssignee"
            v-model="defectAssigneeId"
          >
            <option value="">Не назначен</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.email }}
            </option>
          </select>
        </div>
        <div class="mb-3">
          <label for="defectDueDate" class="form-label">Срок</label>
          <input
            type="date"
            class="form-control"
            id="defectDueDate"
            v-model="defectDueDate"
          />
        </div>
        <div class="mb-3">
          <label for="defectAttachments" class="form-label">Вложения (URL)</label>
          <input
            type="text"
            class="form-control"
            id="defectAttachments"
            v-model="defectAttachments"
            placeholder="Введите URL через запятую (например, file1.jpg, file2.pdf)"
          />
        </div>
        <button type="submit" class="btn btn-primary mb-4">Добавить дефект</button>
      </form>

      <!-- Форма редактирования дефекта -->
      <div v-if="editingDefect">
        <h3>Редактировать дефект #{{ editingDefect.id }}</h3>
        <form @submit.prevent="updateDefect">
          <div class="mb-3">
            <label for="editDefectDescription" class="form-label">Описание дефекта</label>
            <textarea
              class="form-control"
              id="editDefectDescription"
              v-model.trim="editDefectDescription"
              placeholder="Введите описание дефекта"
              required
            ></textarea>
          </div>
          <div class="mb-3">
            <label for="editDefectPriority" class="form-label">Приоритет</label>
            <select
              class="form-control"
              id="editDefectPriority"
              v-model="editDefectPriority"
              required
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="editDefectStatus" class="form-label">Статус</label>
            <select
              class="form-control"
              id="editDefectStatus"
              v-model="editDefectStatus"
              required
            >
              <option value="open">Открыт</option>
              <option value="closed">Закрыт</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="editDefectAssignee" class="form-label">Исполнитель</label>
            <select
              class="form-control"
              id="editDefectAssignee"
              v-model="editDefectAssigneeId"
            >
              <option value="">Не назначен</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.email }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label for="editDefectDueDate" class="form-label">Срок</label>
            <input
              type="date"
              class="form-control"
              id="editDefectDueDate"
              v-model="editDefectDueDate"
            />
          </div>
          <div class="mb-3">
            <label for="editDefectAttachments" class="form-label">Вложения (URL)</label>
            <input
              type="text"
              class="form-control"
              id="editDefectAttachments"
              v-model="editDefectAttachments"
              placeholder="Введите URL через запятую (например, file1.jpg, file2.pdf)"
            />
          </div>
          <button type="submit" class="btn btn-success mb-4">Сохранить</button>
          <button type="button" class="btn btn-secondary mb-4 ms-2" @click="cancelEditDefect">Отмена</button>
        </form>
      </div>

      <!-- Кнопки экспорта дефектов -->
      <div v-if="defects.length > 0" class="mb-4">
        <button class="btn btn-info me-2" @click="exportDefects('csv')">Экспорт дефектов в CSV</button>
        <button class="btn btn-info" @click="exportDefects('excel')">Экспорт дефектов в Excel</button>
      </div>

      <!-- Список дефектов -->
      <h3>Дефекты проекта #{{ selectedProjectId }}</h3>
      <div v-if="defects.length > 0">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Приоритет</th>
              <th>Статус</th>
              <th>Исполнитель</th>
              <th>Срок</th>
              <th>Вложения</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="defect in defects" :key="defect.id">
              <td>{{ defect.description }}</td>
              <td>{{ defect.priority }}</td>
              <td>{{ defect.status === 'open' ? 'Открыт' : 'Закрыт' }}</td>
              <td>{{ defect.assigneeEmail || '-' }}</td>
              <td>{{ defect.dueDate ? new Date(defect.dueDate).toLocaleDateString() : '-' }}</td>
              <td>{{ defect.attachments || '-' }}</td>
              <td>{{ new Date(defect.createdAt).toLocaleDateString() }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="startEditDefect(defect)">Редактировать</button>
                <button class="btn btn-sm btn-danger" @click="deleteDefect(defect.id)">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>У проекта пока нет дефектов.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Projects',
  data() {
    return {
      projectName: '',
      projectDescription: '',
      projectStatus: 'open',
      editProjectName: '',
      editProjectDescription: '',
      editProjectStatus: 'open',
      editClosedAt: '',
      editingProject: null,
      selectedProjectId: null,
      defectDescription: '',
      defectPriority: 'medium',
      defectStatus: 'open',
      defectAssigneeId: '',
      defectDueDate: '',
      defectAttachments: '',
      editDefectDescription: '',
      editDefectPriority: 'medium',
      editDefectStatus: 'open',
      editDefectAssigneeId: '',
      editDefectDueDate: '',
      editDefectAttachments: '',
      editingDefect: null,
      projects: [],
      defects: [],
      users: []
    };
  },
  methods: {
    async createProject() {
      try {
        const response = await axios.post('http://localhost:3000/api/projects', {
          name: this.projectName,
          description: this.projectDescription,
          status: this.projectStatus
        }, { withCredentials: true });
        alert(`Проект создан: ${response.data.message}`);
        this.projectName = '';
        this.projectDescription = '';
        this.projectStatus = 'open';
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка создания проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchProjects() {
      try {
        const response = await axios.get('http://localhost:3000/api/projects', { withCredentials: true });
        this.projects = response.data.projects.map(project => ({
          ...project,
          createdBy: response.data.users.find(user => user.id === project.userId)?.email || 'Неизвестно'
        }));
      } catch (error) {
        alert(`Ошибка загрузки проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
        this.$router.push('/login');
      }
    },
    startEditProject(project) {
      this.editingProject = project;
      this.editProjectName = project.name;
      this.editProjectDescription = project.description || '';
      this.editProjectStatus = project.status;
      this.editClosedAt = project.closedAt ? new Date(project.closedAt).toISOString().split('T')[0] : '';
    },
    async updateProject() {
      try {
        const response = await axios.put(`http://localhost:3000/api/projects/${this.editingProject.id}`, {
          name: this.editProjectName,
          description: this.editProjectDescription,
          status: this.editProjectStatus,
          closedAt: this.editClosedAt ? new Date(this.editClosedAt).getTime() : null
        }, { withCredentials: true });
        alert(`Проект обновлён: ${response.data.message}`);
        this.editingProject = null;
        this.editProjectName = '';
        this.editProjectDescription = '';
        this.editProjectStatus = 'open';
        this.editClosedAt = '';
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка обновления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditProject() {
      this.editingProject = null;
      this.editProjectName = '';
      this.editProjectDescription = '';
      this.editProjectStatus = 'open';
      this.editClosedAt = '';
    },
    async deleteProject(projectId) {
      if (!confirm('Вы уверены, что хотите удалить проект? Все связанные дефекты будут удалены.')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/projects/${projectId}`, { withCredentials: true });
        alert(`Проект удалён: ${response.data.message}`);
        if (this.selectedProjectId === projectId) {
          this.selectedProjectId = null;
          this.defects = [];
        }
        this.fetchProjects();
      } catch (error) {
        alert(`Ошибка удаления проекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async selectProject(projectId) {
      this.selectedProjectId = projectId;
      this.defects = [];
      this.defectDescription = '';
      this.defectPriority = 'medium';
      this.defectStatus = 'open';
      this.defectAssigneeId = '';
      this.defectDueDate = '';
      this.defectAttachments = '';
      this.editingDefect = null;
      await this.fetchDefects();
    },
    async createDefect() {
      try {
        const response = await axios.post('http://localhost:3000/api/defects', {
          projectId: this.selectedProjectId,
          description: this.defectDescription,
          priority: this.defectPriority,
          status: this.defectStatus,
          assigneeId: this.defectAssigneeId || null,
          dueDate: this.defectDueDate ? new Date(this.defectDueDate).getTime() : null,
          attachments: this.defectAttachments ? this.defectAttachments.split(',').map(url => url.trim()) : null
        }, { withCredentials: true });
        alert(`Дефект создан: ${response.data.message}`);
        this.defectDescription = '';
        this.defectPriority = 'medium';
        this.defectStatus = 'open';
        this.defectAssigneeId = '';
        this.defectDueDate = '';
        this.defectAttachments = '';
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка создания дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchDefects() {
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.selectedProjectId}`, { withCredentials: true });
        this.defects = response.data.defects.map(defect => ({
          ...defect,
          assigneeEmail: response.data.users.find(user => user.id === defect.assigneeId)?.email || null
        }));
      } catch (error) {
        alert(`Ошибка загрузки дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    startEditDefect(defect) {
      console.log('Начало редактирования дефекта:', defect);
      this.editingDefect = defect;
      this.editDefectDescription = defect.description;
      this.editDefectPriority = defect.priority;
      this.editDefectStatus = defect.status;
      this.editDefectAssigneeId = defect.assigneeId || '';
      this.editDefectDueDate = defect.dueDate ? new Date(defect.dueDate).toISOString().split('T')[0] : '';
      this.editDefectAttachments = defect.attachments ? defect.attachments.join(', ') : '';
    },
    async updateDefect() {
      try {
        console.log('Редактирование дефекта:', { id: this.editingDefect.id, description: this.editDefectDescription, status: this.editDefectStatus });
        const response = await axios.put(`http://localhost:3000/api/defects/${this.editingDefect.id}`, {
          description: this.editDefectDescription,
          priority: this.editDefectPriority,
          status: this.editDefectStatus,
          assigneeId: this.editDefectAssigneeId || null,
          dueDate: this.editDefectDueDate ? new Date(this.editDefectDueDate).getTime() : null,
          attachments: this.editDefectAttachments ? this.editDefectAttachments.split(',').map(url => url.trim()) : null
        }, { withCredentials: true });
        alert(`Дефект обновлён: ${response.data.message}`);
        this.editingDefect = null;
        this.editDefectDescription = '';
        this.editDefectPriority = 'medium';
        this.editDefectStatus = 'open';
        this.editDefectAssigneeId = '';
        this.editDefectDueDate = '';
        this.editDefectAttachments = '';
        this.fetchDefects();
      } catch (error) {
        console.error('Ошибка обновления дефекта:', error.response?.data || error.message);
        alert(`Ошибка обновления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    cancelEditDefect() {
      this.editingDefect = null;
      this.editDefectDescription = '';
      this.editDefectPriority = 'medium';
      this.editDefectStatus = 'open';
      this.editDefectAssigneeId = '';
      this.editDefectDueDate = '';
      this.editDefectAttachments = '';
    },
    async deleteDefect(defectId) {
      if (!confirm('Вы уверены, что хотите удалить дефект?')) {
        return;
      }
      try {
        const response = await axios.delete(`http://localhost:3000/api/defects/${defectId}`, { withCredentials: true });
        alert(`Дефект удалён: ${response.data.message}`);
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка удаления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async exportProjects(format) {
      try {
        const response = await axios.get(`http://localhost:3000/api/export/projects?format=${format}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `projects.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка экспорта проектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async exportDefects(format) {
      try {
        const response = await axios.get(`http://localhost:3000/api/export/defects?projectId=${this.selectedProjectId}&format=${format}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `defects_${this.selectedProjectId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка экспорта дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users', { withCredentials: true });
        this.users = response.data.users;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    }
  },
  mounted() {
    this.fetchProjects();
    this.fetchUsers();
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 20px;
}
</style>
```